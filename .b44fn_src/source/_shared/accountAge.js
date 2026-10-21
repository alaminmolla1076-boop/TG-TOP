// Account age buckets and estimation from Telegram user IDs.
//
// Telegram never exposes a registration date, but user IDs are assigned
// roughly sequentially, so an anchor table of known ID→date points gives a
// good estimate of when an account was created. Anchors come from public
// research datasets (gramjs/telethon session collectors); the 2017–2021 and
// 2024+ gaps are interpolated with community estimates.
//
// Seller-selected listings: Regular has no minimum-age claim, 30d and 6m
// claim a minimum age, and a year claims registration in that calendar year.
// Verification checks the claim without changing the selected listing category.
// ageBucketOf remains the automatic classification for legacy bot submissions.
const FIRST_YEAR = 2013;
const DAY_MS = 86400000;
const ANCHORS = [
  [0, '2013-08-01'],
  [2768409, '2013-11-01'],
  [7679610, '2013-12-31'],
  [11538514, '2014-02-01'],
  [38015510, '2014-03-01'],
  [63263518, '2014-10-27'],
  [101260938, '2015-03-06'],
  [116812045, '2015-07-23'],
  [143445125, '2015-12-01'],
  [148670295, '2016-01-08'],
  [171295414, '2016-03-09'],
  [222021233, '2016-06-08'],
  [297621225, '2016-12-16'],
  [328594461, '2017-01-28'],
  [400169472, '2017-07-31'],
  [450000000, '2017-12-31'],
  [650000000, '2018-12-31'],
  [805158066, '2019-07-15'],
  [1100000000, '2019-12-31'],
  [1500000000, '2020-09-30'],
  [1974255900, '2021-10-12'],
  [5031711230, '2021-12-06'],
  [5045293264, '2022-01-13'],
  [5601951167, '2022-10-02'],
  [5964221956, '2023-01-09'],
  [6271031786, '2023-02-12'],
  [6684986493, '2023-09-25'],
  [6926984452, '2024-01-09'],
  [7104310277, '2024-04-19'],
  [7458668365, '2024-08-02'],
  [7700000000, '2024-12-31'],
  [7900000000, '2025-07-01'],
  [8050000000, '2025-11-11'],
  [8200000000, '2026-05-01'],
  [8350000000, '2026-10-01'],
].map(([id, d]) => [id, Date.parse(d + 'T00:00:00Z')]);

// Estimated creation date (ms since epoch) of a Telegram user ID.
export function estimateAccountDate(userId) {
  const id = Number(userId) || 0;
  if (id <= 0) return ANCHORS[0][1];
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [idA, tA] = ANCHORS[i];
    const [idB, tB] = ANCHORS[i + 1];
    if (id >= idA && id <= idB) {
      if (tB <= tA) return tB;
      return tA + ((id - idA) / (idB - idA)) * (tB - tA);
    }
  }
  // Beyond the last anchor — extrapolate with the last segment's slope.
  const [idA, tA] = ANCHORS[ANCHORS.length - 2];
  const [idB, tB] = ANCHORS[ANCHORS.length - 1];
  const msPerId = idB > idA ? (tB - tA) / (idB - idA) : 0;
  return tB + (id - idB) * msPerId;
}

// The age bucket a Telegram user ID belongs to right now.
export function ageBucketOf(userId, nowMs = Date.now()) {
  const est = estimateAccountDate(userId);
  const year = new Date(est).getUTCFullYear();
  const curYear = new Date(nowMs).getUTCFullYear();
  if (year >= curYear) {
    const days = (nowMs - est) / DAY_MS;
    if (days < 30) return 'regular';
    if (days < 183) return '30d';
    return '6m';
  }
  const clamped = Math.max(FIRST_YEAR, Math.min(curYear - 1, year));
  return String(clamped);
}

// All sellable age categories, youngest first.
export function ageCategories(nowMs = Date.now()) {
  const curYear = new Date(nowMs).getUTCFullYear();
  const years = [];
  for (let y = curYear - 1; y >= FIRST_YEAR; y--) years.push(String(y));
  return ['regular', '30d', '6m', ...years];
}

export function isValidAgeCategory(value) {
  return ageCategories().includes(String(value || '').trim());
}

export function matchesSelectedAge(userId, selection, nowMs = Date.now()) {
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id <= 0 || !isValidAgeCategory(selection)) return false;
  if (selection === 'regular') return true;
  const estimated = estimateAccountDate(id);
  const days = (nowMs - estimated) / DAY_MS;
  if (selection === '30d') return days >= 30;
  if (selection === '6m') return days >= 183;
  return String(new Date(estimated).getUTCFullYear()) === selection;
}