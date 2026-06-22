// Netlify Function — proxy for C-Care API
// Uses "node:" prefix on imports so esbuild treats them as Node built-ins (not polyfilled)

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
    // Endpoint comes from ?_path=:splat (set by Netlify redirect rule)
    // e.g. /ccare-api/GetDirectToken?UserID=xxx → _path="GetDirectToken", UserID="xxx"
    const allParams = { ...(event.queryStringParameters || {}) };
    const endpointPath = allParams._path || "";
    delete allParams._path;

    // Re-encode params — encodeURIComponent correctly handles + / = in base64 UserID
    const qs = Object.keys(allParams)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
      .join("&");

    const targetUrl = `${TARGET_BASE}/${endpointPath}${qs ? "?" + qs : ""}`;
    console.log(`[proxy] ${event.httpMethod} => ${targetUrl}`);

    const reqHeaders = {
      "Content-Type": "application/json",
      Host: "mobileapp.c-care.mu",
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
          timeout: 15000,
        },
        (res) => {
          let data = "";
          res.on("data", (c) => { data += c; });
          res.on("end", () => {
            console.log(`[proxy] Backend ${res.statusCode}: ${data.substring(0, 200)}`);
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
        reject(new Error("Backend connection timed out after 15s"));
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

    return { statusCode: responseData.status, headers: CORS, body: responseData.body };
  } catch (err) {
    console.error("[proxy] Handler error:", err.message);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ proxyError: err.message, code: err.code }),
    };
  }
};
