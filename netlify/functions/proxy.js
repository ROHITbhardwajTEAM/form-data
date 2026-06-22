// Netlify Serverless Function — CJS proxy for C-Care API
// This directory has its own package.json with "type":"commonjs"
// so require() and exports work correctly regardless of root package.json

"use strict";

const https = require("https");
const http = require("http");

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

// SSL agent: bypass self-signed cert on non-standard port 14443
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  // ── Build target URL ──────────────────────────────────────────────────────
  // Use event.rawUrl to preserve the EXACT original query string
  // (avoids double-encoding of base64 UserID param)
  let subPath = "";
  let search = "";

  try {
    // rawUrl e.g.: https://admirable-xxx.netlify.app/ccare-api/GetDirectToken?UserID=M%2Bxxx
    const { URL } = require("url");
    const originalUrl = new URL(event.rawUrl);
    subPath = originalUrl.pathname.replace(/^\/ccare-api/, "");
    search = originalUrl.search; // exact query string as sent by browser
  } catch (_) {
    // fallback
    const rawPath = (event.path || "").replace(/^\/ccare-api/, "");
    subPath = rawPath;
    const qp = event.queryStringParameters || {};
    const qs = Object.keys(qp)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(qp[k])}`)
      .join("&");
    search = qs ? `?${qs}` : "";
  }

  const targetUrl = `${TARGET_BASE}${subPath}${search}`;

  console.log(`[proxy] ${event.httpMethod} => ${targetUrl}`);

  // ── Build request options ─────────────────────────────────────────────────
  const reqHeaders = {
    "Content-Type":
      (event.headers && event.headers["content-type"]) || "application/json",
    Host: "mobileapp.c-care.mu",
  };
  if (event.headers && event.headers["authorization"]) {
    reqHeaders["Authorization"] = event.headers["authorization"];
  }

  // ── Make proxied request ──────────────────────────────────────────────────
  const responseData = await new Promise((resolve, reject) => {
    const { URL } = require("url");
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parseInt(parsed.port) || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: event.httpMethod || "GET",
      headers: reqHeaders,
      agent: isHttps ? httpsAgent : undefined,
      timeout: 15000,
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        console.log(`[proxy] Backend responded: ${res.statusCode}`);
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on("error", (err) => {
      console.error("[proxy] Error:", err.message);
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (event.body && event.httpMethod !== "GET") {
      const bodyStr = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf-8")
        : event.body;
      req.write(bodyStr);
    }

    req.end();
  });

  return {
    statusCode: responseData.status,
    headers: corsHeaders(),
    body: responseData.body,
  };
};
