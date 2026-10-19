import React from "react";

// Unmodified USDt token artwork supplied at https://tether.io/media/.
// Original: https://tether.io/wp-content/uploads/tether-io_logos/tether_USDt_token_w-background_PNG/tether_USDt_token_w-background.png
export default function UsdtLogo({ className = "h-14 w-14" }) {
  return (
    <img
      src="https://base44.app/api/apps/6ad1ec4d9f3d182acc871a46/files/mp/public/6ad1ec4d9f3d182acc871a46/684cb36ed_tether-usdt-official.png"
      alt="Tether USD₮ (USDT)"
      width={165}
      height={165}
      className={`${className} object-contain`}
    />
  );
}