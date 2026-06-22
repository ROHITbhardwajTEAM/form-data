// Netlify Edge Function — runs on Deno at the CDN edge
// Has direct access to the Request object, so URL is always the ORIGINAL request URL
// No ESM/CJS confusion, no event.rawUrl ambiguity

const TARGET_BASE =
  "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

export default async (request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // request.url IS the original browser URL — no ambiguity
  // e.g. https://admirable-xxx.netlify.app/ccare-api/GetDirectToken?UserID=M%2Bxxx
  const originalUrl = new URL(request.url);

  // Strip /ccare-api prefix to get the backend sub-path
  const subPath = originalUrl.pathname.replace(/^\/ccare-api/, "");

  // originalUrl.search = "?UserID=M%2Bxxx" — EXACT, no re-encoding
  const targetUrl = `${TARGET_BASE}${subPath}${originalUrl.search}`;

  console.log(`[edge-proxy] ${request.method} => ${targetUrl}`);

  const headers = {
    "Content-Type": "application/json",
    "Host": "mobileapp.c-care.mu",
  };

  const authHeader = request.headers.get("authorization");
  if (authHeader) headers["Authorization"] = authHeader;

  const init = {
    method: request.method,
    headers,
  };

  // Forward body for non-GET requests
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const body = await response.text();

    console.log(`[edge-proxy] Backend status: ${response.status}`);

    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("[edge-proxy] Fetch error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};

export const config = { path: "/ccare-api/*" };
