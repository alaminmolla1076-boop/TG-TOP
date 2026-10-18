// SQLite database file builder for Telethon-compatible .session files.
// Generates a 7-page SQLite database matching the exact structure of
// valid Telethon session files: version, sessions, entities, sent_files,
// autoindex, and update_state tables.

const PAGE_SIZE = 4096;

// SQLite varint encoding (big-endian, 7 bits per byte, high bit = continuation)
function encodeVarint(n) {
  if (n <= 127) return [n];
  const bytes = [];
  bytes.unshift(n & 0x7f);
  n = Math.floor(n / 128);
  while (n > 0) {
    bytes.unshift(0x80 | (n & 0x7f));
    n = Math.floor(n / 128);
  }
  return bytes;
}

// Encode a SQLite record (header + body)
function encodeRecord(values) {
  const body = [];
  const types = [];

  for (const v of values) {
    if (v === null) {
      types.push(0);
    } else if (v instanceof Uint8Array || Array.isArray(v)) {
      const arr = v instanceof Uint8Array ? Array.from(v) : v;
      types.push(arr.length * 2 + 12);
      body.push(...arr);
    } else if (typeof v === 'number') {
      if (v === 0) {
        types.push(8);
      } else if (v === 1) {
        types.push(9);
      } else if (v >= -128 && v <= 127) {
        types.push(1);
        body.push(v & 0xff);
      } else if (v >= -32768 && v <= 32767) {
        types.push(2);
        body.push((v >> 8) & 0xff, v & 0xff);
      } else if (v >= -8388608 && v <= 8388607) {
        types.push(3);
        body.push((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
      } else if (v >= -2147483648 && v <= 2147483647) {
        types.push(4);
        body.push((v >>> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
      } else {
        // 64-bit: use BigInt encoding
        const big = BigInt(v);
        const buf = new Uint8Array(8);
        for (let i = 7; i >= 0; i--) {
          buf[i] = Number(big >> BigInt(8 * i) & BigInt(0xff));
        }
        types.push(6);
        body.push(...buf);
      }
    } else if (typeof v === 'string') {
      const strBytes = Array.from(new TextEncoder().encode(v));
      types.push(strBytes.length * 2 + 13);
      body.push(...strBytes);
    }
  }

  const typeVarints = types.flatMap(encodeVarint);
  let headerLen = 1 + typeVarints.length;
  let headerLenVarint = encodeVarint(headerLen);
  while (headerLenVarint.length + typeVarints.length !== headerLen) {
    headerLen = headerLenVarint.length + typeVarints.length;
    headerLenVarint = encodeVarint(headerLen);
  }
  return [...headerLenVarint, ...typeVarints, ...body];
}

// Build a table leaf cell: payload_length varint + rowid varint + payload
function buildCell(rowid, payload) {
  return [...encodeVarint(payload.length), ...encodeVarint(rowid), ...payload];
}

// Build a B-tree leaf page (table or index)
function buildLeafPage(pageNum, cells, isIndex) {
  const page = new Uint8Array(PAGE_SIZE);
  const hdrOffset = pageNum === 1 ? 100 : 0;

  if (pageNum === 1) {
    const h = page;
    h.set(new TextEncoder().encode('SQLite format 3\0'), 0);
    h[16] = (PAGE_SIZE >> 8) & 0xff; h[17] = PAGE_SIZE & 0xff;
    h[18] = 1; h[19] = 1; h[20] = 0;
    h[21] = 64; h[22] = 32; h[23] = 32;
    // file change counter (offset 24-27)
    h[27] = 13;
    // database size in pages (offset 28-31)
    h[31] = 7;
    // schema cookie (offset 40-43)
    h[43] = 5;
    // schema format (offset 44-47)
    h[47] = 4;
    // text encoding = UTF-8 (offset 56-59)
    h[59] = 1;
    // version-valid-for (offset 92-95)
    h[95] = 13;
    // SQLite version number (offset 96-99) = 3037002
    const ver = 3037002;
    h[96] = (ver >>> 24) & 0xff; h[97] = (ver >> 16) & 0xff; h[98] = (ver >> 8) & 0xff; h[99] = ver & 0xff;
  }

  // B-tree page header (8 bytes)
  page[hdrOffset] = isIndex ? 0x0a : 0x0d;  // leaf index or leaf table
  page[hdrOffset + 1] = 0; page[hdrOffset + 2] = 0;  // first freeblock
  page[hdrOffset + 3] = (cells.length >> 8) & 0xff;
  page[hdrOffset + 4] = cells.length & 0xff;

  let contentStart = PAGE_SIZE;
  const cellOffsets = [];
  for (const cell of cells) {
    contentStart -= cell.length;
    cellOffsets.push(contentStart);
  }
  page[hdrOffset + 5] = (contentStart >> 8) & 0xff;
  page[hdrOffset + 6] = contentStart & 0xff;
  page[hdrOffset + 7] = 0;

  // Cell pointer array
  const ptrStart = hdrOffset + 8;
  for (let i = 0; i < cells.length; i++) {
    page[ptrStart + i * 2] = (cellOffsets[i] >> 8) & 0xff;
    page[ptrStart + i * 2 + 1] = cellOffsets[i] & 0xff;
  }
  // Cell data
  for (let i = 0; i < cells.length; i++) {
    page.set(new Uint8Array(cells[i]), cellOffsets[i]);
  }
  return page;
}

// SQL statements matching Telethon's exact schema
const SQL = {
  version: 'CREATE TABLE version (version integer primary key)',
  sessions: 'CREATE TABLE sessions (\n                    dc_id integer primary key,\n                    server_address text,\n                    port integer,\n                    auth_key blob,\n                    takeout_id integer,\n                    tmp_auth_key blob\n                )',
  entities: 'CREATE TABLE entities (\n                    id integer primary key,\n                    hash integer not null,\n                    username text,\n                    phone integer,\n                    name text,\n                    date integer\n                )',
  sentFiles: 'CREATE TABLE sent_files (\n                    md5_digest blob,\n                    file_size integer,\n                    type integer,\n                    id integer,\n                    hash integer,\n                    primary key(md5_digest, file_size, type)\n                )',
  updateState: 'CREATE TABLE update_state (\n                    id integer primary key,\n                    pts integer,\n                    qts integer,\n                    date integer,\n                    seq integer\n                )',
};

// Build a complete Telethon-compatible SQLite .session file.
// authKey: Uint8Array (256 bytes), dcId: number, port: number, serverAddress: string
export function buildSessionFile({ authKey, dcId, port, serverAddress }) {
  const keyBytes = authKey instanceof Uint8Array ? Array.from(authKey) : (authKey || []);
  const dId = dcId || 1;
  const prt = port || 443;
  const addr = serverAddress || '';

  // Page 1: sqlite_master (schema) — 6 entries
  const masterCells = [
    buildCell(1, encodeRecord(['table', 'version', 'version', 2, SQL.version])),
    buildCell(2, encodeRecord(['table', 'sessions', 'sessions', 3, SQL.sessions])),
    buildCell(3, encodeRecord(['table', 'entities', 'entities', 4, SQL.entities])),
    buildCell(4, encodeRecord(['table', 'sent_files', 'sent_files', 5, SQL.sentFiles])),
    buildCell(5, encodeRecord(['index', 'sqlite_autoindex_sent_files_1', 'sent_files', 6, null])),
    buildCell(6, encodeRecord(['table', 'update_state', 'update_state', 7, SQL.updateState])),
  ];

  // Page 2: version table — version = 8
  const versionCells = [buildCell(8, encodeRecord([null]))];

  // Page 3: sessions table — dc_id (rowid), server_address, port, auth_key, takeout_id, tmp_auth_key
  const sessionCells = keyBytes.length > 0
    ? [buildCell(dId, encodeRecord([null, addr, prt, keyBytes, null, new Uint8Array(0)]))]
    : [];

  // Pages 4-7: empty tables/index
  const entitiesCells = [];
  const sentFilesCells = [];
  const updateStateCells = [];

  const page1 = buildLeafPage(1, masterCells, false);
  const page2 = buildLeafPage(2, versionCells, false);
  const page3 = buildLeafPage(3, sessionCells, false);
  const page4 = buildLeafPage(4, entitiesCells, false);
  const page5 = buildLeafPage(5, sentFilesCells, false);
  const page6 = buildLeafPage(6, [], true);   // autoindex (leaf index)
  const page7 = buildLeafPage(7, updateStateCells, false);

  const db = new Uint8Array(PAGE_SIZE * 7);
  db.set(page1, 0);
  db.set(page2, PAGE_SIZE);
  db.set(page3, PAGE_SIZE * 2);
  db.set(page4, PAGE_SIZE * 3);
  db.set(page5, PAGE_SIZE * 4);
  db.set(page6, PAGE_SIZE * 5);
  db.set(page7, PAGE_SIZE * 6);
  return db;
}