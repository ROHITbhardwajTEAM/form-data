// Netlify Serverless Function (CommonJS) — C-Care API Proxy
// netlify/functions/package.json has "type":"commonjs" to override root "type":"module"

"use strict";

const https = require("https");

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

// SSL bypass — backend uses self-signed / non-standard port 14443
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
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  // ── Build target URL ──────────────────────────────────────────────────────
  // The redirect passes the API sub-path via ?_path=:splat query param
  // e.g. /ccare-api/GetDirectToken?UserID=xxx → function gets:
  //   event.queryStringParameters = { _path: "GetDirectToken", UserID: "xxx" }
  const allParams = Object.assign({}, event.queryStringParameters || {});
  const endpointPath = allParams._path || "";
  delete allParams._path; // remove internal routing param

  // Re-encode remaining params using encodeURIComponent (handles + / = in base64)
  const otherSearch = Object.keys(allParams)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const targetUrl =
    `${TARGET_BASE}/${endpointPath}` + (otherSearch ? `?${otherSearch}` : "");

  console.log(`[proxy] ${event.httpMethod} => ${targetUrl}`);

  // ── Forward request ───────────────────────────────────────────────────────
  const reqHeaders = {
    "Content-Type": "application/json",
    "Host": "mobileapp.c-care.mu",
  };
  if (event.headers && event.headers["authorization"]) {
    reqHeaders["Authorization"] = event.headers["authorization"];
  }

  const responseData = await new Promise((resolve, reject) => {
    const { URL } = require("url");
    const parsed = new URL(targetUrl);

    const options = {
      hostname: parsed.hostname,
      port: parseInt(parsed.port) || 443,
      path: parsed.pathname + parsed.search,
      method: event.httpMethod || "GET",
      headers: reqHeaders,
      agent: httpsAgent,
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        console.log(`[proxy] Backend status: ${res.statusCode}, body: ${data.substring(0, 100)}`);
        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on("error", (err) => {
      console.error("[proxy] Request error:", err.message);
      reject(err);
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });

    if (event.body && event.httpMethod !== "GET") {
      req.write(event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf-8")
        : event.body);
    }
    req.end();
  });

  return {
    statusCode: responseData.status,
    headers: corsHeaders(),
    body: responseData.body,
  };
};
