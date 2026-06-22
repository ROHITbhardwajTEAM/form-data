
import { getEncryptedDeviceId, aesEncrypt, aesDecrypt } from "../utils/crypto";


const BASE_URL = "/ccare-api";

export async function getDirectToken() {
  const encryptedId = await getEncryptedDeviceId();
  const url = `${BASE_URL}/GetDirectToken?UserID=${encodeURIComponent(encryptedId)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const rawText = await response.text();

  const cleanBase64 = rawText.replace(/^"|"$/g, "");


  try {
    const decrypted = await aesDecrypt(cleanBase64);

    const parsed = JSON.parse(decrypted);

    return parsed.response;
  } catch (err) {
    console.error("DECRYPT ERROR:", err.message);
    throw err;
  }
}
export async function saveOnlineRegistration(payload, apiToken) {

  const encryptedPayload = await aesEncrypt(payload);
  const url = `${BASE_URL}/SaveOnlineRegistration`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (apiToken) {
    headers["Authorization"] = `Bearer ${apiToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,

    body: JSON.stringify({ "RegistrationDetails": encryptedPayload }),
  });

  if (!response.ok) throw new Error(`Save failed: ${response.status}`);

  const text = await response.text();


  let decrypted = null;
  try {
    const cleanBase64 = text.replace(/^"|"$/g, "");
    decrypted = await aesDecrypt(cleanBase64);
  } catch (err) {
    // Decryption failed, not encrypted base64 text
  }

  let data = null;
  if (decrypted) {
    try {
      data = JSON.parse(decrypted);
    } catch (err) {
      // Decrypted text was not valid JSON
    }
  }

  // If we couldn't decrypt or parse the decrypted text, try parsing the raw text
  if (!data) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Raw text was not valid JSON
    }
  }

  // If data is a string (e.g. double JSON-encoded), parse it again
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (err) {
      // Double parsing failed
    }
  }

  if (data && typeof data === "object") {
    if (data.status === false) {
      throw new Error(data.message || "Registration failed");
    }
    return data;
  }

  throw new Error("Invalid server response");
}

export async function getCountryList() {
  const url = `${BASE_URL}/GetCountryList`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Country list request failed: ${response.status}`);
  }

  const rawText = await response.text();
  const cleanBase64 = rawText.replace(/^"|"$/g, "");

  try {
    const decrypted = await aesDecrypt(cleanBase64);
    const parsed = JSON.parse(decrypted);
    return parsed.response; // returns the array of countries
  } catch (err) {
    console.error("DECRYPT COUNTRY LIST ERROR:", err.message);
    throw err;
  }
}