// Telegram MTProto layer for the Base44 runtime.
//
// gramJS cannot complete a handshake here (its socket layer silently stalls),
// but @mtproto/core's browser build — WebSocket transport + WebCrypto — works.
// This module wraps it and keeps sessions stored in gramJS StringSession format
// so every existing session string (and .session file export) stays compatible.
import MTProto from 'npm:@mtproto/core@6.3.0/envs/browser/index.js';
import { encodeSession, parseSessionString } from './telegramSessionCodec.js';
import passwordDigest from './passwordDigest.js';
import { API_ID, API_HASH } from './telegramConfig.js';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Network/transport hiccups that are worth retrying — never a real Telegram
// rejection (those carry explicit error codes like PASSWORD_HASH_INVALID).
export function isTransportError(msg = '') {
  return /timed? ?out|timeout|network|socket|websocket|handshake|connect|closed|ECONN|EPIPE|ETIMEDOUT|fetch failed|Internal|-503|RPC_CALL_FAIL|AUTH_KEY_UNREGISTERED_RETRY/i.test(msg);
}

const DC_IP = { 1: '149.154.175.53', 2: '149.154.167.51', 3: '149.154.175.100', 4: '149.154.167.91', 5: '91.108.56.130' };

// A single Telegram connection + its in-memory key storage.
export class Mt {
  constructor(sessionString, { syncAuth = true } = {}) {
    this.syncAuth = syncAuth;
    this.mem = new Map();
    this.dcId = 2;
    if (sessionString) {
      const parsed = parseSessionString(sessionString);
      if (parsed) {
        this.dcId = parsed.dcId;
        this.mem.set(`${parsed.dcId}authKey`, JSON.stringify([...parsed.authKey]));
        // The library only reuses a stored auth key when a server salt is
        // stored too — otherwise it silently starts a brand new handshake
        // (which invalidates the login code tied to the old key). Seed a
        // placeholder salt; Telegram replies with bad_server_salt and the
        // library refreshes it and retries the request automatically.
        this.mem.set(`${parsed.dcId}serverSalt`, JSON.stringify([...crypto.randomBytes(8)]));
      }
    }
    const mem = this.mem;
    this.client = new MTProto({
      api_id: Number(API_ID),
      api_hash: API_HASH,
      storageOptions: {
        instance: {
          set: (k, v) => { mem.set(k, v); return Promise.resolve(); },
          get: (k) => Promise.resolve(mem.has(k) ? mem.get(k) : null),
        },
      },
    });
    if (this.dcId !== 2) this.client.setDefaultDc(this.dcId);
  }

  // Invoke a TL method, transparently following DC migrations.
  // Transient transport failures (DC timeout, dropped WebSocket, FLOOD_WAIT)
  // are retried here so callers never see them as real errors.
  async call(method, params = {}, attempt = 1) {
    const MAX_ATTEMPTS = 4;
    try {
      return await this.client.call(method, params, { dcId: this.dcId, syncAuth: this.syncAuth });
    } catch (e) {
      const msg = e?.error_message || e?.message || String(e);
      const m = /(?:PHONE|NETWORK|USER|FILE|STATS)_MIGRATE_(\d+)/.exec(msg);
      if (m) {
        this.dcId = Number(m[1]);
        await this.client.setDefaultDc(this.dcId);
        return await this.call(method, params, attempt);
      }
      // Telegram asks us to wait — honour short waits instead of failing.
      const flood = /FLOOD_WAIT_(\d+)/.exec(msg);
      if (flood && Number(flood[1]) <= 30 && attempt < MAX_ATTEMPTS) {
        await sleep((Number(flood[1]) + 1) * 1000);
        return await this.call(method, params, attempt + 1);
      }
      if (isTransportError(msg) && attempt < MAX_ATTEMPTS) {
        await sleep(1200 * attempt);
        return await this.call(method, params, attempt + 1);
      }
      throw normalizeError(e);
    }
  }

  // Export the current auth key as a gramJS-compatible session string so the
  // rest of the app (ZIP export, .session builder) keeps working unchanged.
  async save() {
    const raw = this.mem.get(`${this.dcId}authKey`);
    if (!raw) return '';
    const bytes = Buffer.from(JSON.parse(raw));
    return encodeSession(this.dcId, DC_IP[this.dcId] || DC_IP[2], 443, bytes);
  }

  get authKeyBytes() {
    const raw = this.mem.get(`${this.dcId}authKey`);
    return raw ? Buffer.from(JSON.parse(raw)) : null;
  }

  async isAuthorized() {
    try {
      await this.call('users.getUsers', { id: [{ _: 'inputUserSelf' }] });
      return true;
    } catch {
      return false;
    }
  }

  async getMe() {
    const users = await this.call('users.getUsers', { id: [{ _: 'inputUserSelf' }] });
    return users?.[0] || null;
  }

  close() {
    for (const rpc of this.client.rpcs.values()) {
      rpc.sendAcks?.cancel?.();
      const transport = rpc.transport;
      transport.connect = () => {};
      transport.removeAllListeners();
      if (transport.socket && transport.socket.readyState < 2) transport.socket.close();
    }
    this.client.rpcs.clear();
  }
}

// Turns a stored session string into { dcId, authKey }. Accepts gramJS
// StringSession strings (what the app has always stored).
export { parseSessionString };

// Telegram errors from @mtproto/core carry error_message, not message.
export function normalizeError(e) {
  const msg = e?.error_message || e?.message || String(e);
  const err = new Error(msg);
  err.errorMessage = e?.error_message || undefined;
  return err;
}

export function errorMessageOf(e) {
  return e?.error_message || e?.errorMessage || e?.message || String(e);
}

export function randomId() {
  return crypto.randomBytes(8).readBigInt64LE(0).toString();
}

// ---- 2FA ------------------------------------------------------------------

// Sets a 2FA cloud password on an authenticated account.
// currentPassword is only needed when changing an existing password.
export async function setTwoFactor(mt, newPassword, currentPassword = '', hint = 'tgtop') {
  const pwd = await mt.call('account.getPassword', {});
  if (!pwd.new_algo || pwd.new_algo._ === 'passwordKdfAlgoUnknown') {
    throw new Error('Unknown password encryption method');
  }

  // Telegram requires salt1 to be extended with 32 random bytes.
  const algo = {
    salt1: Buffer.concat([Buffer.from(pwd.new_algo.salt1), crypto.randomBytes(32)]),
    salt2: Buffer.from(pwd.new_algo.salt2),
    g: pwd.new_algo.g,
    p: Buffer.from(pwd.new_algo.p),
  };
  const newPasswordHash = await passwordDigest(algo, newPassword);

  let password = { _: 'inputCheckPasswordEmpty' };
  if (pwd.has_password && currentPassword) {
    password = await srpCheck(pwd, currentPassword);
  }

  await mt.call('account.updatePasswordSettings', {
    password,
    new_settings: {
      _: 'account.passwordInputSettings',
      new_algo: {
        _: 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
        salt1: algo.salt1,
        salt2: algo.salt2,
        g: algo.g,
        p: algo.p,
      },
      new_password_hash: Buffer.from(newPasswordHash),
      hint,
    },
  });
}

// Removes the 2FA password from an authenticated account.
// Telegram deletes the cloud password when new_password_hash is empty. Two
// payload shapes are accepted by different layers, so try both.
export async function removeTwoFactor(mt, currentPassword) {
  const pwd = await mt.call('account.getPassword', {});
  if (!pwd.has_password) return;
  const password = await srpCheck(pwd, currentPassword);

  const variants = [
    // Canonical removal: unknown KDF algo + empty hash.
    {
      _: 'account.passwordInputSettings',
      new_algo: { _: 'passwordKdfAlgoUnknown' },
      new_password_hash: Buffer.alloc(0),
      // A non-empty hint is required: the serializer drops empty strings from
      // the flagged field group, which makes Telegram reject the payload.
      hint: 'tgtop',
    },
    // Fallback for builds that cannot serialize passwordKdfAlgoUnknown:
    // send the real algo but an empty hash, which the server treats as delete.
    {
      _: 'account.passwordInputSettings',
      new_algo: pwd.new_algo
        ? {
            _: 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
            salt1: Buffer.concat([Buffer.from(pwd.new_algo.salt1), crypto.randomBytes(32)]),
            salt2: Buffer.from(pwd.new_algo.salt2),
            g: pwd.new_algo.g,
            p: Buffer.from(pwd.new_algo.p),
          }
        : { _: 'passwordKdfAlgoUnknown' },
      new_password_hash: Buffer.alloc(0),
      hint: 'tgtop',
    },
  ];

  let lastError;
  for (const new_settings of variants) {
    try {
      await mt.call('account.updatePasswordSettings', { password, new_settings });
    } catch (e) {
      lastError = e;
      continue;
    }
    // Verify against Telegram itself — only a has_password=false reply proves
    // the cloud password is really gone.
    const after = await mt.call('account.getPassword', {});
    if (!after.has_password) return;
    lastError = new Error('2FA still active after removal');
  }
  throw normalizeError(lastError);
}

// Builds an inputCheckPasswordSRP for an existing password.
// @mtproto/core's browser build does not expose getSRPParams, so the SRP math
// is done with gramJS's computeCheck and the result mapped back to raw TL.
export async function srpCheck(pwd, password) {
  const [{ computeCheck }, { Api }] = await Promise.all([
    import('npm:telegram@2.26.22/Password.js'),
    import('npm:telegram@2.26.22/tl/index.js'),
  ]);
  const algo = new Api.PasswordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow({
    salt1: Buffer.from(pwd.current_algo.salt1),
    salt2: Buffer.from(pwd.current_algo.salt2),
    g: pwd.current_algo.g,
    p: Buffer.from(pwd.current_algo.p),
  });
  const req = new Api.account.Password({
    hasPassword: true,
    currentAlgo: algo,
    // gramJS's generated class keeps this field as srp_B (not srpB).
    srp_B: Buffer.from(pwd.srp_B),
    srpId: BigInt(pwd.srp_id),
  });
  const check = await computeCheck(req, password);
  return {
    _: 'inputCheckPasswordSRP',
    srp_id: pwd.srp_id,
    A: Buffer.from(check.A),
    M1: Buffer.from(check.M1),
  };
}

export function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

// ---- Messaging helpers ----------------------------------------------------

// Resolves a public username into an inputPeerUser.
export async function resolvePeer(mt, username) {
  const res = await mt.call('contacts.resolveUsername', { username });
  const u = res?.users?.[0];
  if (!u) throw new Error(`Cannot resolve @${username}`);
  return { _: 'inputPeerUser', user_id: u.id, access_hash: u.access_hash };
}

export async function sendText(mt, peer, message) {
  return mt.call('messages.sendMessage', { peer, message, random_id: randomId() });
}

export async function history(mt, peer, limit = 5) {
  const res = await mt.call('messages.getHistory', {
    peer, offset_id: 0, offset_date: 0, add_offset: 0, limit, max_id: 0, min_id: 0, hash: 0,
  });
  return res?.messages || [];
}

export async function logout(mt) {
  try { await mt.call('auth.logOut', {}); } catch { /* best-effort */ }
}