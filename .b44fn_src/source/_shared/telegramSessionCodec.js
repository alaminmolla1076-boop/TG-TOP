import { Buffer } from 'node:buffer';

// The same version-1 bytes written by gramJS StringSession.save(), without
// importing its Telegram client, TL constructors, and connection machinery.
export function encodeSession(dcId, serverAddress, port, authKey) {
  const address = Buffer.from(serverAddress);
  const length = Buffer.alloc(2);
  length.writeInt16BE(address.length);
  const portBytes = Buffer.alloc(2);
  portBytes.writeInt16BE(port);
  return '1' + Buffer.concat([
    Buffer.from([dcId]), length, address, portBytes, Buffer.from(authKey),
  ]).toString('base64');
}

// Accept existing gramJS strings plus Telethon IPv4 and IPv6 strings.
export function parseSessionString(value) {
  const text = String(value || '').trim();
  if (text[0] !== '1') return null;
  const encoded = text.slice(1);
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < 263) return null;
  let keyOffset;
  if (encoded.length === 352) {
    keyOffset = 7;
  } else {
    const addressLength = bytes.readInt16BE(1);
    keyOffset = addressLength > 100 ? 19 : 5 + addressLength;
  }
  if (keyOffset < 5 || bytes.length - keyOffset !== 256) return null;
  return { dcId: bytes[0] || 2, authKey: Buffer.from(bytes.subarray(keyOffset)) };
}