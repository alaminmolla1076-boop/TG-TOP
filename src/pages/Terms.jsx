import React from "react";
import LegalPage from "@/components/legal/LegalPage";

const sections = [
  {
    heading: "1. Acceptance of terms",
    body: [
      "By accessing TG TOP through the app or the Telegram bot you agree to these Terms & Conditions. If you do not agree, please do not use the service.",
    ],
  },
  {
    heading: "2. Eligibility",
    body: [
      "You must be at least 18 years old, hold a valid Telegram account, and be legally permitted to use digital-asset services in your jurisdiction.",
    ],
  },
  {
    heading: "3. The service",
    body: [
      "TG TOP is a marketplace where sellers list Telegram accounts and buyers purchase them using their in-app USDT balance. Each purchase carries a 5% platform commission, which is included in the marketplace price — sellers receive the sale amount net of commission.",
    ],
  },
  {
    heading: "4. Top-ups",
    bullets: [
      "Top-ups are accepted in USDT via OKPay, Keeper Wallet (TON) and on-chain USDT (TRC20 / ERC20 / BEP20).",
      "On-chain top-ups are verified automatically — send the exact amount shown, on the exact network shown. Amounts sent on the wrong network may be unrecoverable.",
      "Balances are credited after the required network confirmations. Send only from wallets you control.",
    ],
  },
  {
    heading: "5. Withdrawals",
    bullets: [
      "Withdrawals are paid in USDT. The minimum withdrawal is $1.00 and every withdrawal carries a flat $0.10 network fee.",
      "You are solely responsible for the withdrawal address you provide. Funds sent to a wrong or incompatible address cannot be recovered.",
      "Withdrawals are reviewed for security and processed in the order received; on-chain network congestion may cause delays.",
    ],
  },
  {
    heading: "6. Buying accounts",
    body: [
      "Purchased accounts are delivered instantly as session files through your purchases page. Because digital goods are delivered immediately, completed purchases are non-refundable — except where an account is invalid at delivery, in which case contact support with your order details.",
    ],
  },
  {
    heading: "7. Selling accounts",
    bullets: [
      "You may only sell accounts you own and are legally entitled to transfer.",
      "Accounts that are hacked, stolen, obtained by fraud or linked to prohibited activity are strictly forbidden and result in a permanent ban.",
      "Sellers set their own prices; TG TOP validates inventory quality and may reject listings that fail verification.",
      "Selling through TG TOP grants the platform the right to deliver the sold session to the purchasing buyer.",
    ],
  },
  {
    heading: "8. Prohibited conduct",
    bullets: [
      "Fraudulent top-ups or payments, abuse of the verification system or double-spending attempts.",
      "Listing or selling accounts belonging to third parties without consent.",
      "Attempting to reverse, charge back or dispute completed crypto payments.",
      "Any activity that violates Telegram's Terms of Service or applicable law.",
    ],
  },
  {
    heading: "9. Fees",
    body: [
      "The current fee structure: 5% commission on each purchase, $0.10 flat fee per withdrawal, plus on-chain network fees inherent to the blockchain. Fee changes are announced in advance through the app and our official channel.",
    ],
  },
  {
    heading: "10. Suspension & termination",
    body: [
      "We may suspend or ban accounts that violate these terms, attempt fraud, or put other users or the platform at risk. In such cases the remaining balance is refunded via withdrawal review, minus amounts tied to fraudulent activity.",
    ],
  },
  {
    heading: "11. Limitation of liability",
    body: [
      "The service is provided on an \"as is\" basis. To the maximum extent permitted by law, TG TOP is not liable for indirect or consequential losses, or for losses caused by user error such as sending funds to the wrong address or mishandling purchased session files after delivery.",
    ],
  },
  {
    heading: "12. Changes to these terms",
    body: [
      "We may revise these terms from time to time. Continued use of TG TOP after changes are published means you accept the updated terms.",
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These terms govern your use of TG TOP — including top-ups, purchases, sales and withdrawals. Please read them carefully before using the marketplace."
      sections={sections}
    />
  );
}