import { CHAIN, TonConnectUI } from "@tonconnect/ui";

let connector;

export default function getTonConnector() {
  if (!connector) {
    connector = new TonConnectUI({
      manifestUrl: "https://tg-tops.base44.app/tonconnect-manifest.json",
      actionsConfiguration: { returnStrategy: "back" },
    });
    connector.setConnectionNetwork(CHAIN.MAINNET);
  }
  return connector;
}