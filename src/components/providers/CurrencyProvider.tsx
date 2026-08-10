'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: '₱',
  setCurrency: () => {},
  formatAmount: (amount: number) => `₱${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
});

export function CurrencyProvider({ initialCurrency, children }: { initialCurrency: string; children: React.ReactNode }) {
  const [currency, setCurrency] = useState(initialCurrency || '₱');

  const formatAmount = useCallback((amount: number) => {
    return `${currency}${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
