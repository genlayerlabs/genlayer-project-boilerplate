'use client'

import { bytesToHex, hexToBytes } from './hex'

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 120000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(plaintext: string, passphrase: string): Promise<{iv: string, salt: string, data: string}> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return {
    iv: bytesToHex(iv),
    salt: bytesToHex(salt),
    data: bytesToHex(new Uint8Array(ct)),
  };
}

export async function decryptString(payload: {iv: string, salt: string, data: string}, passphrase: string): Promise<string> {
  const iv = new Uint8Array(hexToBytes(payload.iv));
  const salt = new Uint8Array(hexToBytes(payload.salt));
  const data = new Uint8Array(hexToBytes(payload.data));
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return dec.decode(pt);
}
