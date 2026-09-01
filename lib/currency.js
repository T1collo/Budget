// Currency list and formatting. Intl does the symbol/placement work, so adding
// a currency here is a one-line change and needs no per-currency formatting.

export const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "KES", label: "Kenyan Shilling" },
  { code: "NGN", label: "Nigerian Naira" },
  { code: "ZAR", label: "South African Rand" },
  { code: "GHS", label: "Ghanaian Cedi" },
  { code: "UGX", label: "Ugandan Shilling" },
  { code: "TZS", label: "Tanzanian Shilling" },
  { code: "INR", label: "Indian Rupee" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "AED", label: "UAE Dirham" },
];

export const CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));
export const DEFAULT_CURRENCY = "USD";

export function isSupportedCurrency(code) {
  return CURRENCY_CODES.has(code);
}

/** Format an amount in `code`. Unknown codes fall back rather than throwing. */
export function formatMoney(amount, code = DEFAULT_CURRENCY) {
  const value = Number(amount) || 0;
  try {
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: isSupportedCurrency(code) ? code : DEFAULT_CURRENCY,
    });
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

/** Just the symbol, for input prefixes and axis ticks. */
export function currencySymbol(code = DEFAULT_CURRENCY) {
  try {
    return (
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: isSupportedCurrency(code) ? code : DEFAULT_CURRENCY,
      })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? "$"
    );
  } catch {
    return "$";
  }
}
