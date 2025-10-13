'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { pubsub } from '@/lib/pubsub'

export interface Account {
  address?: string;
  externalEvmAddress?: string; // For future MetaMask integration
}

interface AccountContextType {
  account: Account | null;
  notifyAccountChanged: (account: Account | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const unsubscribe = pubsub.on('accountChanged', (newAccount: Account | null) => {
      setAccount(newAccount);
    });

    return unsubscribe;
  }, []);

  const notifyAccountChanged = (newAccount: Account | null) => {
    pubsub.emit('accountChanged', newAccount);
  };

  return (
    <AccountContext.Provider value={{ account, notifyAccountChanged }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
