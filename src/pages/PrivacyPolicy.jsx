import React from "react";
import LegalPage from "@/components/legal/LegalPage";

const sections = [
  {
    heading: "1. Overview",
    body: [
      "This Privacy Policy explains what information TG TOP collects when you use our app and bot, why we collect it, and the choices you have. By using TG TOP you agree to the practices described here.",
    ],
  },
  {
    heading: "2. Information we collect",
    bullets: [
      "Telegram identity: your Telegram ID, username and display name, used to create and secure your account.",
      "Account data: your balance, purchases, sales, listings, withdrawal requests and transaction history.",
      "Session data: when you sell accounts, the session files you submit are stored securely to deliver them to buyers.",
      "Payment data: wallet addresses, on-chain transaction IDs and top-up records. Crypto payments are public by nature — we never ask for exchange passwords or seed phrases.",
      "Technical basics provided by Telegram when the app opens (language, platform).",
    ],
  },
  {
    heading: "3. How we use your information",
    bullets: [
      "To authenticate you and keep your balance and inventory accurate.",
      "To verify top-ups automatically on-chain and process withdrawals.",
      "To deliver purchased accounts and sessions to the right buyer.",
      "To run the marketplace: listings, seller pages, stock counts and pricing.",
      "To prevent fraud, abuse and stolen-account listings.",
      "To answer support requests.",
    ],
  },
  {
    heading: "4. Third-party services",
    body: [
      "Top-ups made with OKPay are processed by OKPay under their own privacy policy; we only receive the payment status and your order reference. Blockchain transactions (USDT on TRC20/ERC20/BEP20, TON) are public records on their respective networks. Telegram processes your messages and identity data as described in Telegram's own Privacy Policy.",
    ],
  },
  {
    heading: "5. Data sharing",
    body: [
      "We do not sell or rent your personal data. We share it only when necessary: with payment providers to complete your top-ups, with the blockchain networks you transact on, and with authorities where required by law.",
    ],
  },
  {
    heading: "6. Security & retention",
    body: [
      "Session files and account data are stored with access controls and kept only as long as needed to operate the marketplace, satisfy our records or resolve disputes. Balance and transaction records are retained for the lifetime of your account.",
    ],
  },
  {
    heading: "7. Your rights",
    body: [
      "You may request access to, correction of, or deletion of your personal data at any time through our support channel. Deleting your account removes your personal data, except records we must keep for financial and fraud-prevention purposes.",
    ],
  },
  {
    heading: "8. Age restrictions",
    body: [
      "TG TOP is intended for adults only. You must be at least 18 years old to use the app and bot.",
    ],
  },
  {
    heading: "9. Changes to this policy",
    body: [
      "We may update this policy as the service evolves. The latest version is always available on this page, and material changes are announced in our official channel.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="TG TOP is a digital marketplace for buying and selling Telegram accounts, with USDT top-ups and withdrawals. This policy describes what data we collect, how we use it and how we protect it."
      sections={sections}
    />
  );
}