import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTelegramWebApp } from "@/lib/TgIdentityContext";

// Expands the Mini App to fullscreen and shows the Telegram native BackButton
// on every page except Home.
export function useTelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) return;

    tg.expand();
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();

    const bb = tg.BackButton;
    if (!bb) return;

    if (location.pathname === "/") {
      bb.hide();
      return;
    }

    const goBack = () => {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate("/");
      }
    };

    bb.onClick(goBack);
    bb.show();

    return () => {
      bb.offClick(goBack);
      bb.hide();
    };
  }, [location.pathname, navigate]);
}