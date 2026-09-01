"use client";

import { createContext, useCallback, useContext } from "react";
import { DEFAULT_CURRENCY, formatMoney, currencySymbol } from "@/lib/currency";

const CurrencyContext = createContext(DEFAULT_CURRENCY);

export function CurrencyProvider({ currency, children }) {
  return (
    <CurrencyContext.Provider value={currency || DEFAULT_CURRENCY}>
      {children}
    </CurrencyContext.Provider>
  );
}

/** `const { format, code, symbol } = useCurrency()` in any client component. */
export function useCurrency() {
  const code = useContext(CurrencyContext);
  const format = useCallback((amount) => formatMoney(amount, code), [code]);
  return { code, format, symbol: currencySymbol(code) };
}
