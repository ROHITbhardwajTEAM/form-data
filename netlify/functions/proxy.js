// Netlify Function — proxy for C-Care API
// node: prefix ensures esbuild treats https as Node built-in (not polyfilled with fetch)

import https from "node:https";
import { URL } from "node:url";

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

// Bypass self-signed SSL cert on non-standard port 14443
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    // ── PATH: get from event.rawUrl (the original browser URL, before Netlify redirect)
    // event.rawUrl = "https://admirable-xxx.netlify.app/ccare-api/GetDirectToken?UserID=xxx"
    const originalUrl = new URL(event.rawUrl);
    const subPath = originalUrl.pathname.replace(/^\/ccare-api/, "");
    // e.g. "/GetDirectToken"

    // ── QUERY PARAMS: from event.queryStringParameters (decoded by Netlify)
    // We re-encode each value with encodeURIComponent so + / = in base64 are safe
    const allParams = { ...(event.queryStringParameters || {}) };
    const qs = Object.keys(allParams)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
      .join("&");

    // Combine correct path + correctly re-encoded query string
    const targetUrl = `${TARGET_BASE}${subPath}${qs ? "?" + qs : ""}`;

    console.log(`[proxy] ${event.httpMethod} => ${targetUrl}`);

    const reqHeaders = {
      "Content-Type": "application/json",
      Host: "mobileapp.c-care.mu:14443",
    };
    if (event.headers?.authorization) {
      reqHeaders.Authorization = event.headers.authorization;
    }

    const responseData = await new Promise((resolve, reject) => {
      const parsed = new URL(targetUrl);

      const req = https.request(
        {
          hostname: parsed.hostname,
          port: parseInt(parsed.port) || 443,
          path: parsed.pathname + parsed.search,
          method: event.httpMethod || "GET",
          headers: reqHeaders,
          agent: httpsAgent,
          timeout: 20000,
        },
        (res) => {
          let data = "";
          res.on("data", (c) => { data += c; });
          res.on("end", () => {
            console.log(`[proxy] Backend ${res.statusCode}: ${data.substring(0, 300)}`);
            resolve({ status: res.statusCode, body: data });
          });
        }
      );

      req.on("error", (err) => {
        console.error("[proxy] Connection error:", err.code, err.message);
        reject(err);
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Backend timed out (20s)"));
      });

      if (event.body && event.httpMethod !== "GET") {
        req.write(
          event.isBase64Encoded
            ? Buffer.from(event.body, "base64").toString("utf-8")
            : event.body
        );
      }
      req.end();
    });

    return {
      statusCode: responseData.status,
      headers: CORS,
      body: responseData.body,
    };
  } catch (err) {
    console.error("[proxy] Error:", err.message);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ proxyError: err.message, code: err.code }),
    };
  }
};
