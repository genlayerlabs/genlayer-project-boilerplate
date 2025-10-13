'use client'

import { createClient, createAccount as glCreateAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { encryptString, decryptString } from "@/lib/crypto";
import { pubsub } from "@/lib/pubsub";

const ENC_KEY = "gl.enc.account.v1";
const SES_KEY = "gl.session.priv.v1";
const LAST_ADDR = "gl.last.address.v1";
const MNEMONIC_KEY = "gl.enc.mnemonic.v1";

let _account: any = null;
let _endpoint: string | undefined = undefined;

// Initialize endpoint from environment
if (typeof window !== 'undefined') {
  _endpoint = process.env.NEXT_PUBLIC_STUDIO_URL || undefined;
}

export function setAccountFromPrivKey(privHex: string) {
  _account = glCreateAccount(privHex as `0x${string}`);
  if (typeof window !== 'undefined') {
    try { 
      localStorage.setItem(LAST_ADDR, _account.address); 
    } catch {}
  }
  pubsub.emit('accountChanged', { address: _account.address });
  return _account;
}

export async function saveEncryptedPrivKey(privHex: string, passphrase: string) {
  const payload = await encryptString(privHex, passphrase);
  if (typeof window !== 'undefined') {
    localStorage.setItem(ENC_KEY, JSON.stringify(payload));
  }
}

export async function saveEncryptedMnemonic(mnemonic: string, passphrase: string) {
  const payload = await encryptString(mnemonic, passphrase);
  if (typeof window !== 'undefined') {
    localStorage.setItem(MNEMONIC_KEY, JSON.stringify(payload));
  }
}

export function getEncryptedMnemonic(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MNEMONIC_KEY);
  if (!raw) return null;
  return raw;
}

export async function createAccountSecure(passphrase?: string) {
  const priv = generatePrivateKey();
  setAccountFromPrivKey(priv);
  if (passphrase) {
    await saveEncryptedPrivKey(priv, passphrase);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SES_KEY);
    }
  } else {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SES_KEY, priv);
    }
  }
  return _account;
}

export async function importPrivKeySecure(privHex: string, passphrase: string) {
  setAccountFromPrivKey(privHex);
  await saveEncryptedPrivKey(privHex, passphrase);
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SES_KEY);
  }
  return _account;
}

export async function importMnemonicSecure(mnemonic: string, passphrase: string) {
  const { walletFromMnemonic } = await import('@/lib/localWallet');
  const wallet = walletFromMnemonic(mnemonic);
  return await importPrivKeySecure(wallet.privateKey, passphrase);
}

export async function unlockWithPassphrase(passphrase: string) {
  if (typeof window === 'undefined') throw new Error("No encrypted key found");
  const raw = localStorage.getItem(ENC_KEY);
  if (!raw) throw new Error("No encrypted key found");
  const payload = JSON.parse(raw);
  const priv = await decryptString(payload, passphrase);
  return setAccountFromPrivKey(priv);
}

export function tryLoadSession() {
  if (typeof window === 'undefined') return null;
  const priv = sessionStorage.getItem(SES_KEY);
  return priv ? setAccountFromPrivKey(priv) : null;
}

export function clearAccount() {
  _account = null;
  if (typeof window !== 'undefined') {
    try { 
      localStorage.removeItem(ENC_KEY); 
      localStorage.removeItem(LAST_ADDR); 
      localStorage.removeItem(MNEMONIC_KEY);
      sessionStorage.removeItem(SES_KEY); 
    } catch {}
  }
  pubsub.emit('accountChanged', null);
}

export function makeClient() {
  const cfg: any = { chain: studionet };
  if (_endpoint) cfg.endpoint = _endpoint;
  if (_account) cfg.account = _account;
  return createClient(cfg);
}

export function setEndpoint(url?: string) { 
  _endpoint = url || undefined; 
}

export function getAccount() { 
  return _account; 
}

export function getLastAddress(): string { 
  if (typeof window === 'undefined') return "";
  try { 
    return localStorage.getItem(LAST_ADDR) || ""; 
  } catch { 
    return ""; 
  } 
}

export function onAccountChanged(fn: (account: any) => void) {
  return pubsub.on('accountChanged', fn);
}
