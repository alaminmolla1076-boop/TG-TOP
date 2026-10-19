// Extracts Telegram session strings from various file formats:
//   - ZIP archives containing .session (SQLite), .json, or .txt files
//   - Standalone .session (SQLite) files
//   - Standalone .json files with auth_key
//   - Text files with one StringSession per line
//
// Returns an array of gramjs-compatible StringSession strings.

import { extractZip } from './zipExtractor.js';
import { parseSessionFile, parseJsonSession, normalizeSessionInput } from './sessionParser.js';

// Check if bytes look like a ZIP file (PK\x03\x04 magic)
function isZip(bytes) {
  return bytes.length > 4 &&
    bytes[0] === 0x50 && bytes[1] === 0x4b &&
    bytes[2] === 0x03 && bytes[3] === 0x04;
}

// Check if bytes look like a SQLite file
function isSqlite(bytes) {
  if (bytes.length < 15) return false;
  const header = new TextDecoder().decode(bytes.slice(0, 15));
  return header === 'SQLite format 3';
}

// Extract sessions from a file (bytes + filename).
// Returns { sessions: string[], meta: { source, count } }
export async function extractSessionsFromFile(fileBytes, fileName) {
  const bytes = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
  const lowerName = (fileName || '').toLowerCase();

  // 1. ZIP archive
  if (isZip(bytes) || lowerName.endsWith('.zip')) {
    return await extractFromZip(bytes);
  }

  // 2. Standalone .session (SQLite) file
  if (isSqlite(bytes) || lowerName.endsWith('.session')) {
    try {
      const session = parseSessionFile(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      return { sessions: [session], meta: { source: 'session_file', count: 1 } };
    } catch (e) {
      throw new Error(`Failed to parse .session file: ${e.message}`);
    }
  }

  // 3. Text-based file (.txt, .json, or unknown) — treat as text
  const text = new TextDecoder().decode(bytes);
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);

  const sessions = [];
  for (const line of lines) {
    try {
      const normalized = normalizeSessionInput(line);
      sessions.push(normalized);
    } catch (e) {
      // Skip lines that can't be parsed as sessions
    }
  }

  if (sessions.length === 0) {
    throw new Error('No valid sessions found in file');
  }

  return { sessions, meta: { source: 'text_file', count: sessions.length } };
}

// Extract sessions from a ZIP archive.
// Prioritizes .session (SQLite) files, then .json files with auth_key,
// then .txt files with session strings.
async function extractFromZip(bytes) {
  const entries = await extractZip(bytes);
  const sessions = [];
  const errors = [];

  // Sidecar metadata files (e.g. 79333067453.json next to 79333067453.session)
  // carry the account's existing 2FA password. Collect them first so each
  // session can be paired with its password by base file name.
  const baseNameOf = (n) => (n || '').split('/').pop().replace(/\.[^.]+$/, '');
  const digitsOf = (n) => (n || '').replace(/\D/g, '');
  // Sellers name the 2FA field in many ways (twoFA, two_factor_password,
  // cloud_password, 2fa_pass …), so any key that looks like a password field is
  // accepted instead of a fixed list.
  const pickPassword = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const strings = Object.entries(obj).filter(([, v]) => typeof v === 'string' && v.trim());
    // 2FA-specific keys win over a generic "password" field, which in some
    // archives means something else entirely.
    const specific = strings.find(([k]) => /2fa|twofa|two_factor|twofactor|cloud_pass/i.test(k));
    if (specific) return specific[1].trim();
    const generic = strings.find(([k]) => /^pass(word|wd)?$/i.test(k));
    return generic ? generic[1].trim() : '';
  };
  const passwordByBase = {};
  const passwordByPhone = {};
  for (const entry of entries) {
    if (!entry.data || !entry.data.length || isSqlite(entry.data)) continue;
    let text = '';
    try { text = new TextDecoder().decode(entry.data).trim(); } catch (e) { continue; }
    if (!text.startsWith('{') && !text.startsWith('[')) continue;
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const obj of list) {
        const pwd = pickPassword(obj);
        if (!pwd) continue;
        // Per-account sidecar (79333067453.json) and combined lists that carry
        // the phone inside each record are both supported.
        passwordByBase[baseNameOf(entry.name)] = pwd;
        const phone = digitsOf(String(obj.phone || obj.phone_number || obj.number || obj.session_file || ''));
        if (phone) passwordByPhone[phone] = pwd;
      }
    } catch (e) { /* not metadata */ }
  }

  // Base names of real SQLite sessions — a JSON file sharing a base name is a
  // sidecar (metadata only) and must not be read as a second session, which
  // used to produce a duplicate entry without its 2FA password.
  const sqliteBases = new Set();
  for (const entry of entries) {
    if (entry.data && entry.data.length && isSqlite(entry.data)) sqliteBases.add(baseNameOf(entry.name));
  }

  // Content-based detection: real archives use all sorts of names (no
  // extension, .dat, nested folders, mac metadata), so every entry is
  // inspected by its actual bytes instead of its file name.
  for (const entry of entries) {
    const name = entry.name || '';
    const lowerName = name.toLowerCase();
    if (!entry.data || !entry.data.length) continue;
    if (name.endsWith('/') || lowerName.includes('__macosx') || lowerName.endsWith('.ds_store')) continue;
    if (lowerName.endsWith('-journal')) continue;

    // 1. SQLite .session file (Telethon / Pyrogram)
    if (isSqlite(entry.data)) {
      try {
        const session = parseSessionFile(entry.data.buffer.slice(entry.data.byteOffset, entry.data.byteOffset + entry.data.byteLength));
        const password = passwordByBase[baseNameOf(name)] || passwordByPhone[digitsOf(baseNameOf(name))] || '';
        sessions.push(password ? { session, password } : session);
      } catch (e) {
        errors.push(`${name}: ${e.message}`);
      }
      continue;
    }

    // 2. Text content — JSON session(s), or one session string per line
    let text = '';
    try { text = new TextDecoder().decode(entry.data).trim(); } catch (e) { continue; }
    if (!text) continue;

    if (text.startsWith('{') || text.startsWith('[')) {
      if (sqliteBases.has(baseNameOf(name))) continue; // sidecar metadata
      try {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const obj of list) {
          const session = parseJsonSession(obj);
          const pwd = pickPassword(obj)
            || passwordByBase[baseNameOf(name)]
            || passwordByPhone[digitsOf(String(obj.phone || obj.phone_number || obj.number || baseNameOf(name)))]
            || '';
          sessions.push(pwd ? { session, password: pwd } : session);
        }
      } catch (e) {
        errors.push(`${name}: ${e.message}`);
      }
      continue;
    }

    let lineFound = 0;
    for (const line of text.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean)) {
      try { sessions.push(normalizeSessionInput(line)); lineFound++; } catch (e) { /* skip line */ }
    }
    if (!lineFound) errors.push(`${name}: no session found`);
  }

  if (sessions.length === 0) {
    const detail = errors.length ? ` (${errors.slice(0, 5).join('; ')})` : ` (${entries.length} file(s) in archive)`;
    throw new Error(`No valid sessions found in ZIP archive${detail}`);
  }

  return { sessions, meta: { source: 'zip', count: sessions.length } };
}