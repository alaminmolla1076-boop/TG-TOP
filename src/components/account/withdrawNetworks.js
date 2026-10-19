import { LOGOS } from "@/components/deposit/logos";

// Shared withdraw network metadata — used by the wizard steps and kept in one
// place so adding a network later is a single edit.
export const NETWORK_META = {
  BEP20: {
    label: "USDT BEP20 (BNB Chain)",
    logo: LOGOS.BEP20,
    hint: "USDT on BNB Chain",
    placeholder: "0x… your BNB Chain USDT address",
    validate: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    error: "Enter a valid BNB Chain address — it starts with 0x and is 42 characters.",
  },
  POLYGON: {
    label: "USDT Polygon PoS",
    logo: LOGOS.POLYGON,
    hint: "USDT on Polygon PoS",
    placeholder: "0x… your Polygon USDT address",
    validate: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    error: "Enter a valid Polygon address — it starts with 0x and is 42 characters.",
  },
  TON: {
    label: "TON Network (Gram)",
    logo: LOGOS.TON,
    hint: "Toncoin — formerly Gram",
    placeholder: "EQ… / UQ… your TON address",
    validate: (a) => /^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$/.test(a) || /^(0|-1):[A-Fa-f0-9]{64}$/.test(a),
    error: "Enter a valid TON address — it starts with EQ… or UQ… (48 characters).",
  },
};