import { CHAIN, TonConnectUI } from "@tonconnect/ui";

let connector;

export default function getTonConnector() {
  if (!connector) {
    connector = new TonConnectUI({
      // Served from whatever domain the app runs on (Vercel or elsewhere).
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
      actionsConfiguration: { returnStrategy: "back" },
    });
    connector.setConnectionNetwork(CHAIN.MAINNET);
  }
  return connector;
}