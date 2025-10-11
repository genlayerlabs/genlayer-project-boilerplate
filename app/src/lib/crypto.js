// Client-side crypto for secure key storage (no Buffer).
// AES-GCM + PBKDF2 using WebCrypto.

const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToHex(u8) {
  return [...u8].map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2) throw new Error("Invalid hex length");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) out[i / 2] = parseInt(h.slice(i, i + 2), 16);
  return out;
}

async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(plaintext, passphrase) {
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

export async function decryptString(payload, passphrase) {
  const iv = hexToBytes(payload.iv);
  const salt = hexToBytes(payload.salt);
  const data = hexToBytes(payload.data);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return dec.decode(pt);
}
