// src/utils/crypto.js
// Matches backend AES encryption exactly:
// Key: "M@K#2pe54md2y%dp_d+MY!1wT)5"
// Salt: [58,214,155,79,178,7,223,84,145,154,100,158,49,134,38,18]
// Iterations: 10, Hash: SHA-256
// Encoding: Unicode (UTF-16 LE)

const ENCRYPTION_KEY = "M@K#2pe54md2y%dp_d+MY!1wT)5";
const SALT = new Uint8Array([58,214,155,79,178,7,223,84,145,154,100,158,49,134,38,18]);
const ITERATIONS = 10;
const DEVICE_ID_RAW = "WEB_KIOSK_001";

/**
 * Derive AES Key + IV using PBKDF2-SHA256 — same as backend Rfc2898DeriveBytes
 */
async function deriveKeyAndIV() {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(ENCRYPTION_KEY),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive 48 bytes: first 32 = Key, next 16 = IV
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: SALT,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    384 // 48 bytes * 8 bits
  );

  const keyBytes = derived.slice(0, 32);
  const ivBytes = derived.slice(32, 48);

  const aesKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );

  return { aesKey, iv: new Uint8Array(ivBytes) };
}

/**
 * Encrypt a plain string → Base64 (same as backend AES_Encrypt_Decrypt isEncryption=true)
 * Backend uses Unicode (UTF-16 LE) encoding
 */
export async function aesEncrypt(plainText) {
  const { aesKey, iv } = await deriveKeyAndIV();

  // Encode as UTF-8 (to match backend Encoding.UTF8.GetBytes)
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(plainText);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    aesKey,
    utf8Bytes
  );

  // Convert to Base64 safely without stack overflow
  const bytes = new Uint8Array(encrypted);
  let binary = "";
  const len = bytes.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Decrypt Base64 string → plain text
 */


export async function aesDecrypt(base64Text) {
  const { aesKey, iv } = await deriveKeyAndIV();

  const encryptedBytes = Uint8Array.from(atob(base64Text), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    aesKey,
    encryptedBytes
  );

  const bytes = new Uint8Array(decrypted);
 try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(bytes);
  } catch {
    let result = "";
    for (let i = 0; i < bytes.length; i += 2) {
      result += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
    }
    return result;
  }
}


/**
 * Get encrypted DeviceID ready to send as UserID param
 */
export async function getEncryptedDeviceId() {
  return await aesEncrypt(DEVICE_ID_RAW);
}

