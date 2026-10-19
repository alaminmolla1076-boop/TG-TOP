import { COMMON } from "./common";
import { MARKET } from "./market";
import { SELL } from "./sell";
import { DEPOSIT } from "./deposit";
import { WITHDRAW } from "./withdraw";
import { ACCOUNT } from "./account";
import { LEGAL } from "./legal";

// Full string catalog — every key maps to its translations; English is the
// fallback when a language is missing an entry.
export const STRINGS = {
  ...COMMON,
  ...MARKET,
  ...SELL,
  ...DEPOSIT,
  ...WITHDRAW,
  ...ACCOUNT,
  ...LEGAL,
};

// translate("bn", "mk.sellers", { n: 3 }) -> "অ্যাকাউন্ট বিক্রেতা"
export function translate(lang, key, params) {
  const entry = STRINGS[key];
  let str = (entry && (entry[lang] || entry.en)) || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}