'use client'

import { HDNodeWallet, Wallet } from "ethers";

export interface WalletInfo {
  mnemonic: string;
  privateKey: string;
  address: string;
}

export function createNewWallet(): WalletInfo {
  const w = HDNodeWallet.createRandom();
  return {
    mnemonic: w.mnemonic?.phrase || "",
    privateKey: w.privateKey,
    address: w.address,
  };
}

export function walletFromMnemonic(phrase: string): WalletInfo {
  const w = HDNodeWallet.fromPhrase(phrase);
  return {
    mnemonic: phrase,
    privateKey: w.privateKey,
    address: w.address,
  };
}

export function walletFromPrivateKey(pk: string): WalletInfo {
  const w = new Wallet(pk);
  return {
    mnemonic: "",
    privateKey: pk,
    address: w.address,
  };
}

export function isValidPrivateKey(hex: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(String(hex).trim());
}
