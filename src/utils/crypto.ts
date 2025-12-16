import { KeyArray } from "../types";

/**
 * Encrypts UTF-8 string using the key.
 * Algorithm: (byte + key[i]) % 256 -> Base64
 */
export const encryptText = (text: string, key: KeyArray): string => {
  if (key.length === 0) return "";

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const L = key.length;

  const outBytes = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    const k = key[i % L];
    const c = (data[i] + k) % 256;
    outBytes[i] = c;
  }

  // Convert Uint8Array to Base64 string
  // Use a chunked approach or reduce for robustness, though btoa works on binary strings
  let binaryString = "";
  for (let i = 0; i < outBytes.length; i++) {
    binaryString += String.fromCharCode(outBytes[i]);
  }

  return btoa(binaryString);
};

/**
 * Decrypts Base64 string using the key.
 * Algorithm: Base64 Decode -> (byte - key[i]) % 256 -> UTF-8 String
 */
export const decryptText = (cipherText: string, key: KeyArray): string => {
  if (key.length === 0) return "";

  try {
    const binaryString = atob(cipherText);
    const encryptedBytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      encryptedBytes[i] = binaryString.charCodeAt(i);
    }

    const L = key.length;
    const outBytes = new Uint8Array(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
      const k = key[i % L];
      // Handling negative modulo result in JS correctly
      // (a - b) % n can be negative in JS.
      // Correct math mod: ((a - b) % n + n) % n
      let m = (encryptedBytes[i] - k) % 256;
      if (m < 0) m += 256;
      outBytes[i] = m;
    }

    const decoder = new TextDecoder("utf-8");
    return decoder.decode(outBytes);
  } catch (e) {
    console.error("Decryption failed", e);
    return "Error: Invalid Cipher Text or Key";
  }
};
