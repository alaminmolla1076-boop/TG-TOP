export const formatMoney = (n) => `$${new Intl.NumberFormat("en-US").format(n || 0)}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";