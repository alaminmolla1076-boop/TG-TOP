import getTonConnector from "@/components/deposit/tonConnector";

// Resolve only after Keeper approves the connection, not when its modal opens.
export default async function connectKeeperWallet() {
  const connector = getTonConnector();
  await connector.connectionRestored;
  if (connector.wallet?.account?.address) return connector.wallet;

  return new Promise((resolve, reject) => {
    let settled = false;
    let stopStatus = () => {};
    let stopModal = () => {};
    function finish(wallet, error) {
      if (settled) return;
      settled = true;
      stopStatus();
      stopModal();
      if (error) reject(error);
      else resolve(wallet);
    }
    stopStatus = connector.onStatusChange(
      (wallet) => { if (wallet?.account?.address) finish(wallet); },
      (error) => finish(null, error),
    );
    stopModal = connector.onSingleWalletModalStateChange((state) => {
      if (state.status === "closed" && state.closeReason === "action-cancelled") {
        finish(connector.wallet || null);
      }
    });
    connector.openSingleWalletModal("tonkeeper").catch((error) => finish(null, error));
  });
}