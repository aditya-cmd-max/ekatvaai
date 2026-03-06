export const handler = async (event, context) => {
  // 1. Handle CORS (Netlify handles most, but this mirrors your worker)
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  // 2. Quick alive check
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: "Ekatva AI Netlify Function is live!" })
    };
  }

  // 3. Must be POST & valid JSON
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Bad request JSON" }) };
  }

  const userMessage = body.message;
  if (!userMessage) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No message provided" }) };
  }

  // Timeout helper
  const fetchWithTimeout = async (url, options, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  // API Keys from Netlify Environment Variables
  const apiKeys = [
    { key: process.env.OPENAI_API_KEY, name: "Key 1" },
    { key: process.env.OPENAI_API_KEY2, name: "Key 2" },
    { key: process.env.OPENAI_API_KEY3, name: "Key 3" },
    { key: process.env.OPENAI_API_KEY4, name: "Key 4" }
  ].filter(item => item.key); // Only use keys that are actually set

  const requestBody = {
    model: "openrouter/free",
    messages: [
      { role: "system", content: "You are Ekatva AI created by Reverbit. Keep responses concise." },
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 200,
    stream: false
  };

  // Logic: Try APIs in parallel (Race)
  const apiPromises = apiKeys.map(({ key, name }) => 
    fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://aditya-cmd-max.github.io/ekatva/chat",
        "X-Title": "Ekatva AI"
      },
      body: JSON.stringify(requestBody)
    })
    .then(async res => {
      if (!res.ok) throw new Error(`${name} failed`);
      const data = await res.json();
      return { reply: data.choices?.[0]?.message?.content, name };
    })
  );

  try {
    const result = await Promise.any(apiPromises); // Promise.any is better for "first success"
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: result.reply, api: result.name })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "All AI gateways failed. Please try again." })
    };
  }
};
