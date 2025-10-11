// GenLayer account & client manager (secure, local-first)

import { createClient, createAccount as glCreateAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { encryptString, decryptString } from "../lib/crypto.js";

const ENC_KEY = "gl.enc.account.v1";
const SES_KEY = "gl.session.priv.v1";
const LAST_ADDR = "gl.last.address.v1";
const MNEMONIC_KEY = "gl.enc.mnemonic.v1"; // encrypted mnemonic storage

let _account = null;
let _endpoint = import.meta.env.VITE_STUDIO_URL || undefined;

// === Account change pub/sub ===
const subs = new Set();                        // các listener
function notify() { for (const fn of subs) try { fn(_account); } catch (_) {} }
export function onAccountChanged(fn) {         // đăng ký listener
  subs.add(fn);
  return () => subs.delete(fn);                // trả về hàm hủy đăng ký
}

// -- Core setter: nhớ notify()
export function setAccountFromPrivKey(privHex) {
  _account = glCreateAccount(privHex);
  try { localStorage.setItem(LAST_ADDR, _account.address); } catch {}
  notify();                                    // <<< thêm dòng này
  return _account;
}

export async function saveEncryptedPrivKey(privHex, passphrase) {
  const payload = await encryptString(privHex, passphrase);
  localStorage.setItem(ENC_KEY, JSON.stringify(payload));
}

export async function saveEncryptedMnemonic(mnemonic, passphrase) {
  const payload = await encryptString(mnemonic, passphrase);
  localStorage.setItem(MNEMONIC_KEY, JSON.stringify(payload));
}

export async function getEncryptedMnemonic(passphrase) {
  const raw = localStorage.getItem(MNEMONIC_KEY);
  if (!raw) return null;
  const payload = JSON.parse(raw);
  return await decryptString(payload, passphrase);
}

export async function createAccountSecure(passphrase) {
  const priv = generatePrivateKey();
  setAccountFromPrivKey(priv);               // connect ngay
  if (passphrase) {
    await saveEncryptedPrivKey(priv, passphrase);  // rồi mới lưu mã hoá
    sessionStorage.removeItem(SES_KEY);
  } else {
    sessionStorage.setItem(SES_KEY, priv);   // dev mode
  }
  return _account;
}

export async function importPrivKeySecure(privHex, passphrase) {
  setAccountFromPrivKey(privHex);
  await saveEncryptedPrivKey(privHex, passphrase);
  sessionStorage.removeItem(SES_KEY);
  return _account;
}

export async function unlockWithPassphrase(passphrase) {
  const raw = localStorage.getItem(ENC_KEY);
  if (!raw) throw new Error("No encrypted key found");
  const payload = JSON.parse(raw);
  const priv = await decryptString(payload, passphrase);
  return setAccountFromPrivKey(priv);
}

export function tryLoadSession() {
  const priv = sessionStorage.getItem(SES_KEY);
  return priv ? setAccountFromPrivKey(priv) : null;
}

export function clearAccount() {
  _account = null;
  try { 
    localStorage.removeItem(ENC_KEY); 
    localStorage.removeItem(LAST_ADDR); 
    localStorage.removeItem(MNEMONIC_KEY);
    sessionStorage.removeItem(SES_KEY); 
  } catch {}
  notify();                                    // <<< thêm dòng này
}

export function makeClient() {
  const cfg = { chain: studionet };
  if (_endpoint) cfg.endpoint = _endpoint;
  if (_account) cfg.account = _account;
  return createClient(cfg);
}

export function setEndpoint(url) { _endpoint = url || undefined; }
export function getAccount() { return _account; }
export function getLastAddress() { try { return localStorage.getItem(LAST_ADDR) || ""; } catch { return ""; } }

// Legacy compatibility - keep existing exports for backward compatibility
export const account = null; // Will be set dynamically
export const client = makeClient(); // Dynamic client
export const createAccount = createAccountSecure;
export const removeAccount = clearAccount;