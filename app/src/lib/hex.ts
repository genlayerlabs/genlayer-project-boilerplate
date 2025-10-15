export function bytesToHex(u8: Uint8Array): string {
  return Array.from(u8).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  // Strip optional "0x" prefix
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  
  // Validate hex string format
  if (h.length % 2 !== 0) {
    throw new Error("Invalid hex length: must be even number of characters");
  }
  
  if (!/^[0-9a-fA-F]+$/.test(h)) {
    throw new Error("Invalid hex string: must contain only hexadecimal characters (0-9, a-f, A-F)");
  }
  
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < h.length; i += 2) {
    const byteValue = parseInt(h.slice(i, i + 2), 16);
    if (Number.isNaN(byteValue)) {
      throw new Error(`Invalid hex byte at position ${i}: "${h.slice(i, i + 2)}"`);
    }
    out[i / 2] = byteValue;
  }
  return out;
}
