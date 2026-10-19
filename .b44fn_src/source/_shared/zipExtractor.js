// ZIP archive extractor with deflate (method 8) and store (method 0) support.
// Uses node:zlib for synchronous inflate. Returns an array of { name, data }.

import { inflateRawSync } from 'node:zlib';

export async function extractZip(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Find End of Central Directory record (PK\x05\x06)
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid ZIP file (no EOCD)');

  const cdCount = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);

  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < cdCount; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const compMethod = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localHeaderOff = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));

    // Read local file header to find the actual data offset
    const localNameLen = dv.getUint16(localHeaderOff + 26, true);
    const localExtraLen = dv.getUint16(localHeaderOff + 28, true);
    const dataStart = localHeaderOff + 30 + localNameLen + localExtraLen;
    const compData = bytes.slice(dataStart, dataStart + compSize);

    let content;
    if (compMethod === 0) {
      content = compData;
    } else if (compMethod === 8) {
      content = inflateRawSync(compData);
    } else {
      // Unsupported method — skip this entry
      p += 46 + nameLen + extraLen + commentLen;
      continue;
    }

    entries.push({ name, data: content });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}