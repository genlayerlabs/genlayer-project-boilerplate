// Local wallet helpers using ethers v6.
// Generate/import mnemonics and private keys entirely in the browser.

import { HDNodeWallet } from "ethers";

export function createNewWallet() {
  // Creates a 12-word BIP39 mnemonic and derives m/44'/60'/0'/0/0.
  const w = HDNodeWallet.createRandom();
  return {
    mnemonic: w.mnemonic?.phrase || "",
    privateKey: w.privateKey,  // 0x-prefixed hex
    address: w.address,        // checksum address
  };
}

export function privateKeyFromMnemonic(phrase) {
  // Default derivation path for EVM-like accounts.
  const w = HDNodeWallet.fromPhrase(phrase);
  return w.privateKey;
}

export function isValidPrivateKey(hex) {
  return /^0x[0-9a-fA-F]{64}$/.test(String(hex).trim());
}

