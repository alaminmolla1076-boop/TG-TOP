import { Buffer } from 'node:buffer';

// Telegram's approved 2048-bit SRP group; keep the same validation as gramJS.
const GOOD_PRIME = 'c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c3720fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f642477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b';
const sha256 = async (parts) => Buffer.from(await globalThis.crypto.subtle.digest('SHA-256', Buffer.concat(parts)));

// Native asynchronous PBKDF2 avoids blocking the Edge worker's CPU budget.
// Preserve Telegram's full SHA-512 / 100,000-iteration password KDF.
export default async function passwordDigest(algo, password) {
  const pBytes = Buffer.from(algo.p);
  if (pBytes.toString('hex') !== GOOD_PRIME || ![3, 4, 5, 7].includes(algo.g)) {
    throw new Error('bad p/g in password');
  }
  const salt1 = Buffer.from(algo.salt1), salt2 = Buffer.from(algo.salt2);
  const hash1 = await sha256([salt1, Buffer.from(password, 'utf8'), salt1]);
  const hash2 = await sha256([salt2, hash1, salt2]);
  const key = await globalThis.crypto.subtle.importKey('raw', hash2, 'PBKDF2', false, ['deriveBits']);
  const hash3 = Buffer.from(await globalThis.crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-512', salt: salt1, iterations: 100000,
  }, key, 512));
  const hash = await sha256([salt2, hash3, salt2]);
  const prime = BigInt('0x' + pBytes.toString('hex'));
  let exponent = BigInt('0x' + hash.toString('hex')), base = BigInt(algo.g), result = 1n;
  while (exponent > 0n) {
    if (exponent & 1n) result = result * base % prime;
    base = base * base % prime;
    exponent >>= 1n;
  }
  return Buffer.from(result.toString(16).padStart(512, '0'), 'hex');
}