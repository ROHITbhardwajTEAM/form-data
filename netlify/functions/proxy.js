// Netlify Serverless Function — acts as a proxy for C-Care API
// Uses Node's built-in https module to support SSL bypass for self-signed certs

const https = require("https");
const http = require("http");
const { URL } = require("url");

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

// Allow self-signed / untrusted SSL certs on the backend
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

exports.handler = async function (event) {
  // event.path when reached via redirect is the rewritten path
  // e.g. /.netlify/functions/proxy/GetDirectToken
  // Strip the function prefix to get the actual API sub-path
  const subPath = event.path
    .replace(/^\/.netlify\/functions\/proxy/, "")
    .replace(/^\/ccare-api/, ""); // fallback if redirect passes original path

  // Reconstruct query string from Netlify's parsed query params object
  const queryParams = event.queryStringParameters || {};
  const queryString =
    Object.keys(queryParams).length > 0
      ? "?" + new URLSearchParams(queryParams).toString()
      : "";

  const targetUrl = `${TARGET_BASE}${subPath}${queryString}`;

  console.log(`[proxy] ${event.httpMethod} ${targetUrl}`);

  // Build request headers
  const reqHeaders = {
    "Content-Type": "application/json",
  };
  if (event.headers && event.headers["authorization"]) {
    reqHeaders["Authorization"] = event.headers["authorization"];
  }

  // Use Node https/http to make the request (supports agent for SSL bypass)
  const responseData = await new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const isHttps = parsedUrl.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: event.httpMethod || "GET",
      headers: reqHeaders,
      agent: isHttps ? httpsAgent : undefined,
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: data })
      );
    });

    req.on("error", reject);

    // Write body for POST/PUT requests
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
