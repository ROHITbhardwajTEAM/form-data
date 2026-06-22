// Netlify Serverless Function (ESM) — proxy for C-Care API
// Project uses "type": "module" in package.json so we MUST use ESM import/export

import https from "https";
import http from "http";
import { URL } from "url";

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

// Bypass self-signed / untrusted SSL certs on the backend
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  // Extract sub-path — works whether Netlify passes original or rewritten path
  // e.g. /ccare-api/GetDirectToken  →  /GetDirectToken
  // e.g. /.netlify/functions/proxy/GetDirectToken  →  /GetDirectToken
  const rawPath = event.path || "";
  const subPath = rawPath
    .replace(/^\/.netlify\/functions\/proxy/, "")
    .replace(/^\/ccare-api/, "");

  // Reconstruct query string using Netlify's parsed queryStringParameters
  const queryParams = event.queryStringParameters || {};
  const queryString =
    Object.keys(queryParams).length > 0
      ? "?" + new URLSearchParams(queryParams).toString()
      : "";

  const targetUrl = `${TARGET_BASE}${subPath}${queryString}`;

  console.log(`[proxy] ${event.httpMethod} → ${targetUrl}`);

  // Forward headers
  const reqHeaders = { "Content-Type": "application/json" };
  if (event.headers?.authorization) {
    reqHeaders["Authorization"] = event.headers.authorization;
  }

  // Make request using Node's https module (supports SSL bypass)
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

    req.on("error", reject);

    if (event.body && event.httpMethod !== "GET") {
      req.write(event.body);
    }
    req.end();
  });

  return {
    statusCode: responseData.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    body: responseData.body,
  };
};
