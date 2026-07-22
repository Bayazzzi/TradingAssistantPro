// Shared mapping of friendly labels → exact CFTC market names, used by both
// the COT summary route and the per-market history route.
export const COT_MARKETS: Array<{ cftc: string; label: string; unit: string }> = [
  { cftc: "EURO FX", label: "EUR", unit: "EUR 125,000" },
  { cftc: "BRITISH POUND", label: "GBP", unit: "GBP 62,500" },
  { cftc: "JAPANESE YEN", label: "JPY", unit: "JPY 12,500,000" },
  { cftc: "AUSTRALIAN DOLLAR", label: "AUD", unit: "AUD 100,000" },
  { cftc: "CANADIAN DOLLAR", label: "CAD", unit: "CAD 100,000" },
  { cftc: "SWISS FRANC", label: "CHF", unit: "CHF 125,000" },
  { cftc: "GOLD", label: "GOLD", unit: "100 troy oz" },
  { cftc: "SILVER", label: "SILVER", unit: "5,000 troy oz" },
  { cftc: "WTI CRUDE OIL 1ST LINE", label: "OIL", unit: "1,000 barrels" },
  { cftc: "BITCOIN", label: "BTC", unit: "5 BTC" },
  { cftc: "E-MINI S&P 500", label: "S&P 500", unit: "$50 × index" },
];

export function cftcNameForLabel(label: string): string | null {
  return COT_MARKETS.find((m) => m.label === label)?.cftc ?? null;
}
