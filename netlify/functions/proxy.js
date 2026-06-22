// Netlify Serverless Function — acts as a proxy for C-Care API
// This avoids CORS issues and 404 errors from plain redirects

const TARGET_BASE = "https://mobileapp.c-care.mu:14443/API/API/APIdigitalregistration";

exports.handler = async function (event) {
  // Strip the function prefix to get the actual API path segment
  // e.g. /.netlify/functions/proxy/GetDirectToken?... → /GetDirectToken?...
  const pathAfterProxy = event.path.replace(/^\/.netlify\/functions\/proxy/, "");
  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const targetUrl = `${TARGET_BASE}${pathAfterProxy}${queryString}`;

  const fetchOptions = {
    method: event.httpMethod,
    headers: {
      "Content-Type": "application/json",
      ...(event.headers["authorization"]
        ? { Authorization: event.headers["authorization"] }
        : {}),
    },
  };

  if (event.body && event.httpMethod !== "GET") {
    fetchOptions.body = event.body;
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const responseText = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: responseText,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Proxy error: " + err.message }),
    };
  }
};
