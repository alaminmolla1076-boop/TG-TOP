// Account age buckets shared by the sell wizard, the stock price editor and
// the market buy page. Mirrors the backend buckets in
// .b44fn_src/source/_shared/accountAge.js: Regular (fresh) → 30 Days+ →
// 6 Month+ → calendar years down to Telegram's first year (2013).
const FIRST_YEAR = 2013;

export const AGE_OPTIONS = (() => {
  const curYear = new Date().getUTCFullYear();
  const years = [];
  for (let y = curYear - 1; y >= FIRST_YEAR; y--) years.push({ value: String(y) });
  return [
    { value: "regular", key: "ag.regular" },
    { value: "30d", key: "ag.30d" },
    { value: "6m", key: "ag.6m" },
    ...years,
  ];
})();

export function ageLabel(value, t) {
  const v = String(value || "");
  const opt = AGE_OPTIONS.find((o) => o.value === v);
  if (opt?.key) return t(opt.key);
  return v;
}