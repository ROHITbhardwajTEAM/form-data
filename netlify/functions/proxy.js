// Netlify Serverless Function (ESM) — C-Care API Proxy
// Uses event.rawUrl to get the EXACT original URL (no double-encoding of base64 UserID)

import https from "https";
import http from "http";
import { URL } from "url";

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

// SSL bypass for backend's self-signed/non-standard cert
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: "",
    };
  }

  let subPath = "";
  let search = "";

  try {
    // event.rawUrl is the FULL original request URL — most reliable source
    // e.g. https://admirable-biscochitos-703b7d.netlify.app/ccare-api/GetDirectToken?UserID=abc%2Bxyz
    const originalUrl = new URL(event.rawUrl);
    const pathname = originalUrl.pathname; // e.g. /ccare-api/GetDirectToken

    // Strip the /ccare-api prefix to get the API sub-path
    subPath = pathname.replace(/^\/ccare-api/, "");
    search = originalUrl.search; // exact query string, e.g. ?UserID=abc%2Bxyz (no re-encoding!)
  } catch {
    // Fallback: reconstruct from event.path + queryStringParameters
    const rawPath = event.path || "";
    subPath = rawPath
      .replace(/^\/.netlify\/functions\/proxy/, "")
      .replace(/^\/ccare-api/, "");

    const qp = event.queryStringParameters || {};
    search =
      Object.keys(qp).length > 0
        ? "?" + new URLSearchParams(qp).toString()
        : "";
  }

  const targetUrl = `${TARGET_BASE}${subPath}${search}`;

  console.log(`[proxy] ${event.httpMethod} ${event.path}`);
  console.log(`[proxy] → ${targetUrl}`);

  // Build request headers
  const reqHeaders = {
    "Content-Type": event.headers?.["content-type"] || "application/json",
    "Host": "mobileapp.c-care.mu",
  };
  if (event.headers?.authorization) {
    reqHeaders["Authorization"] = event.headers.authorization;
  }

  // Make the proxied request using Node's https module (non-standard port + SSL bypass)
  const responseData = await new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: event.httpMethod || "GET",
      headers: reqHeaders,
      agent: isHttps ? httpsAgent : undefined,
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });

    req.on("error", (err) => {
      console.error("[proxy] Request error:", err.message);
      reject(err);
    });

    // Write body for non-GET requests
    if (event.body && event.httpMethod !== "GET") {
      const bodyStr = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf-8")
        : event.body;
      req.write(bodyStr);
    }

    req.end();
  });

  console.log(`[proxy] Response status: ${responseData.status}`);

  return {
    statusCode: responseData.status,
    headers: corsHeaders(),
    body: responseData.body,
  };
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
