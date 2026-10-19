import { Buffer } from 'node:buffer';

// Multi-format Telegram session parser.
// Converts gramjs StringSession, Telethon StringSession, JSON, and .session
// SQLite files into a single gramjs-compatible StringSession string.

// --- SQLite varint reader (big-endian, 7 bits per byte, high bit = continuation) ---
function readVarint(bytes, offset) {
  let result = 0;
  let pos = offset;
  for (let i = 0; i < 8; i++) {
    const byte = bytes[pos];
    pos++;
    result = (result << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return [result, pos];
  }
  result = (result << 8) | bytes[pos];
  pos++;
  return [result, pos];
}

// --- SQLite record parser (header + body) ---
function parseRecord(bytes, offset) {
  const [headerLen, headerStart] = readVarint(bytes, offset);
  const headerEnd = offset + headerLen;
  let headerPos = headerStart;

  const types = [];
  while (headerPos < headerEnd) {
    const [t, next] = readVarint(bytes, headerPos);
    types.push(t);
    headerPos = next;
  }

  let bodyPos = headerEnd;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = [];

  for (const t of types) {
    if (t === 0) {
      values.push(null);
    } else if (t === 1) {
      values.push(dv.getInt8(bodyPos)); bodyPos += 1;
    } else if (t === 2) {
      values.push(dv.getInt16(bodyPos, false)); bodyPos += 2;
    } else if (t === 3) {
      const v = (bytes[bodyPos] << 16) | (bytes[bodyPos + 1] << 8) | bytes[bodyPos + 2];
      values.push(v < 0x800000 ? v : v - 0x1000000); bodyPos += 3;
    } else if (t === 4) {
      values.push(dv.getInt32(bodyPos, false)); bodyPos += 4;
    } else if (t === 5) {
      let v = 0;
      for (let i = 0; i < 6; i++) v = (v << 8) | bytes[bodyPos + i];
      values.push(v); bodyPos += 6;
    } else if (t === 6) {
      values.push(Number(dv.getBigInt64(bodyPos, false))); bodyPos += 8;
    } else if (t === 7) {
      values.push(dv.getFloat64(bodyPos, false)); bodyPos += 8;
    } else if (t === 8) {
      values.push(0);
    } else if (t === 9) {
      values.push(1);
    } else if (t >= 12 && t % 2 === 0) {
      const len = (t - 12) / 2;
      values.push(bytes.slice(bodyPos, bodyPos + len));
      bodyPos += len;
    } else if (t >= 13 && t % 2 === 1) {
      const len = (t - 13) / 2;
      values.push(new TextDecoder().decode(bytes.slice(bodyPos, bodyPos + len)));
      bodyPos += len;
    } else {
      values.push(null);
    }
  }

  return values;
}

// --- Telegram DC server addresses (for Pyrogram sessions that don't store it) ---
const DC_SERVER_ADDRESSES = {
  1: '149.154.175.50',
  2: '149.154.167.51',
  3: '149.154.175.100',
  4: '149.154.167.91',
  5: '91.108.56.130',
};

export function getDcServerAddress(dcId) {
  return DC_SERVER_ADDRESSES[dcId] || DC_SERVER_ADDRESSES[1];
}

// --- Builds a gramjs-compatible StringSession from raw components ---
export function buildGramjsStringSession(dcId, serverAddress, port, authKey) {
  const dcBuffer = Buffer.from([dcId || 1]);
  const addressBuffer = Buffer.from(String(serverAddress || ''));
  const addressLengthBuffer = Buffer.alloc(2);
  addressLengthBuffer.writeInt16BE(addressBuffer.length, 0);
  const portBuffer = Buffer.alloc(2);
  portBuffer.writeInt16BE(Number(port || 443), 0);
  const keyBuffer = Buffer.from(authKey);
  return '1' + Buffer.concat([dcBuffer, addressLengthBuffer, addressBuffer, portBuffer, keyBuffer]).toString('base64');
}

// --- Parses a .session SQLite file (ArrayBuffer) → gramjs StringSession ---
// Auto-detects Telethon vs Pyrogram format by reading the CREATE TABLE SQL.
export function parseSessionFile(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const dv = new DataView(arrayBuffer);

  const header = new TextDecoder().decode(bytes.slice(0, 15));
  if (header !== 'SQLite format 3') {
    throw new Error('Not a valid SQLite .session file');
  }

  let pageSize = dv.getUint16(16, false);
  if (pageSize === 1) pageSize = 65536;

  // Page 1: 100-byte DB header, then sqlite_master B-tree
  const btreeOffset = 100;
  const pageType = bytes[btreeOffset];
  let sessionsRootPage = -1;
  let sessionsSql = '';

  if (pageType === 0x0d) {
    const cellCount = dv.getUint16(btreeOffset + 3, false);
    const cellPtrStart = btreeOffset + 8;
    for (let i = 0; i < cellCount; i++) {
      const cellOffset = dv.getUint16(cellPtrStart + i * 2, false);
      let [, pos] = readVarint(bytes, cellOffset);
      [, pos] = readVarint(bytes, pos);
      const record = parseRecord(bytes, pos);
      // sqlite_master: type, name, tbl_name, rootpage, sql
      if (record[0] === 'table' && record[1] === 'sessions') {
        sessionsRootPage = record[3];
        sessionsSql = typeof record[4] === 'string' ? record[4] : '';
        break;
      }
    }
  }

  if (sessionsRootPage === -1) {
    throw new Error('sessions table not found');
  }

  // Detect format from the CREATE TABLE SQL.
  // Pyrogram: has "test_mode" or "api_id" column, no "server_address".
  // Telethon: has "server_address" and "port" columns.
  const isPyrogram = /test_mode|api_id/i.test(sessionsSql) && !/server_address/i.test(sessionsSql);

  const pageOffset = (sessionsRootPage - 1) * pageSize;
  const pType = bytes[pageOffset];
  if (pType !== 0x0d) {
    throw new Error('sessions table uses interior page (not supported)');
  }

  const cellCount = dv.getUint16(pageOffset + 3, false);
  if (cellCount === 0) {
    throw new Error('No session data in .session file');
  }

  // Read ALL cells from the sessions leaf page and return the first valid one.
  // Cell pointer values are relative to the PAGE start, so add pageOffset.
  const cellPtrStart = pageOffset + 8;
  for (let i = 0; i < cellCount; i++) {
    const cellRelOffset = dv.getUint16(cellPtrStart + i * 2, false);
    const cellOffset = pageOffset + cellRelOffset;
    let [, pos] = readVarint(bytes, cellOffset);
    let rowId;
    [rowId, pos] = readVarint(bytes, pos);
    const record = parseRecord(bytes, pos);
    // dc_id is an INTEGER PRIMARY KEY, so SQLite stores it as NULL in the
    // record and keeps the real value in the row id.
    if (record[0] === null || record[0] === undefined) record[0] = rowId;

    if (isPyrogram) {
      // Pyrogram sessions: dc_id, api_id, test_mode, auth_key, date, user_id, is_bot
      const dcId = record[0] || 1;
      const authKey = record[3];
      if (authKey && authKey.length >= 200) {
        return buildGramjsStringSession(dcId, getDcServerAddress(dcId), 443, authKey);
      }
    } else {
      // Telethon sessions: dc_id, server_address, port, auth_key, takeout_id, tmp_auth_key
      const dcId = record[0] || 1;
      const serverAddress = record[1] || getDcServerAddress(dcId);
      const port = record[2] || 443;
      const authKey = record[3];
      if (authKey && authKey.length >= 200) {
        return buildGramjsStringSession(dcId, serverAddress, port, authKey);
      }
    }
  }

  throw new Error('Invalid or missing auth_key in sessions table');
}

// --- Parses a Pyrogram StringSession → gramjs StringSession ---
// Pyrogram StringSession is base64-encoded binary with this layout:
//   version(4B BE) | dc_id(4B BE) | api_id(4B BE) | api_hash(4B len + str) |
//   date(4B) | app_version(4B len + str) | device_model(4B len + str) |
//   system_version(4B len + str) | lang_code(4B len + str) |
//   system_lang_code(4B len + str) | auth_key(256B)
// The auth_key is always the LAST 256 bytes.
export function parsePyrogramStringSession(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('Empty Pyrogram session');

  // Pyrogram uses URL-safe base64
  const b64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = Buffer.from(b64, 'base64');
  if (decoded.length < 256 + 12) {
    throw new Error('Pyrogram session too short');
  }

  // Auth key = last 256 bytes
  const authKey = decoded.slice(decoded.length - 256);

  // DC ID = bytes 4-8 (big-endian int32, after the 4-byte version)
  const dcId = decoded.readInt32BE(4);

  return buildGramjsStringSession(dcId, getDcServerAddress(dcId), 443, authKey);
}

// --- Detects if a string is a Pyrogram StringSession ---
// Pyrogram sessions start with "BQ" (base64 of \x01\x00...) or similar patterns.
// They do NOT start with "1" (which is gramjs/Telethon format).
function isPyrogramStringSession(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed || trimmed.startsWith('1')) return false;
  // Try to decode as base64 and check if it looks like a Pyrogram session
  try {
    const b64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(b64, 'base64');
    // Pyrogram v2: first 4 bytes = version (1), next 4 bytes = DC ID (1-5)
    if (decoded.length >= 256 + 8) {
      const version = decoded.readInt32BE(0);
      const dcId = decoded.readInt32BE(4);
      if (version === 1 && dcId >= 1 && dcId <= 5) {
        return true;
      }
    }
  } catch (e) {
    // not base64
  }
  return false;
}

// --- Parses a JSON session object → gramjs StringSession ---
export function parseJsonSession(input) {
  const obj = typeof input === 'string' ? JSON.parse(input) : input;
  const dcId = obj.dc_id ?? obj.dcId ?? obj.dc ?? 1;
  const serverAddress = obj.server_address || obj.ip_address || obj.serverAddress || obj.ip || '';
  const port = obj.port || 443;
  const authKeyRaw = obj.auth_key || obj.session_auth_key || obj.authKey || obj.key || '';

  let authKeyBuffer;
  if (typeof authKeyRaw === 'string') {
    if (/^[0-9a-fA-F]+$/.test(authKeyRaw) && authKeyRaw.length >= 512) {
      authKeyBuffer = Buffer.from(authKeyRaw, 'hex');
    } else {
      authKeyBuffer = Buffer.from(authKeyRaw, 'base64');
    }
  } else if (authKeyRaw instanceof Uint8Array || authKeyRaw instanceof ArrayBuffer) {
    authKeyBuffer = Buffer.from(authKeyRaw);
  } else {
    throw new Error('No auth_key in JSON');
  }

  if (authKeyBuffer.length < 200) {
    throw new Error('auth_key too short');
  }

  return buildGramjsStringSession(dcId, serverAddress, port, authKeyBuffer);
}

// --- Normalizes any session input to a gramjs StringSession string ---
// Handles: gramjs StringSession, Telethon StringSession, Pyrogram StringSession,
//          JSON, base64-encoded .session files
export function normalizeSessionInput(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('Empty session');

  // 1. JSON format
  if (trimmed.startsWith('{')) {
    try {
      return parseJsonSession(trimmed);
    } catch (e) {
      // fall through — might be a StringSession that starts with '{' (unlikely but safe)
    }
  }

  // 2. Base64-encoded SQLite .session file
  try {
    const decoded = Buffer.from(trimmed, 'base64');
    if (decoded.length > 15 && decoded.slice(0, 15).toString('latin1') === 'SQLite format 3') {
      return parseSessionFile(decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength));
    }
  } catch (e) {
    // fall through
  }

  // 3. Pyrogram StringSession (does NOT start with "1")
  if (isPyrogramStringSession(trimmed)) {
    return parsePyrogramStringSession(trimmed);
  }

  // 4. gramjs/Telethon StringSession: "1" + base64 of dc/address/port/256-byte key.
  // Anything else (README lines, notes, phone lists) is not a session.
  if (!/^1[A-Za-z0-9+/=_-]{300,}$/.test(trimmed)) {
    throw new Error('Not a recognizable session string');
  }
  return trimmed;
}