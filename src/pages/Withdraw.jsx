import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTgIdentity } from "@/lib/TgIdentityContext";
import WithdrawWizard from "@/components/account/WithdrawWizard";

export default function Withdraw() {
  const { fetchMyData } = useTgIdentity();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    fetchMyData()
      .then((data) => setBalance(Number(data.balance) || 0))
      .catch(() => setBalance(0));
  }, []);

  if (balance === null) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return <WithdrawWizard balance={balance} onDone={() => navigate("/")} />;
}