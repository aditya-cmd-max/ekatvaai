// Load the training data - adjust path as needed
let buildSystemPrompt = () => "You are Ekatva AI..."; // Fallback

try {
  // Try to load training data if it exists
  const trainingModule = require('https://aditya-cmd-max.github.io/ekatvaai/chat/ai.training.data.js');
  buildSystemPrompt = trainingModule.buildSystemPrompt;
  console.log("✅ Training data loaded successfully");
} catch (e) {
  console.log("⚠️ Training data not found, using default prompt");
}

export const handler = async (event, context) => {
  // Log everything for debugging
  console.log("🔵 Function invoked with method:", event.httpMethod);
  console.log("🔵 Headers:", JSON.stringify(event.headers));
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    console.log("🟡 Handling OPTIONS preflight");
    return { 
      statusCode: 204, 
      headers, 
      body: "" 
    };
  }

  // Handle GET request (test endpoint)
  if (event.httpMethod === "GET") {
    console.log("🟢 Handling GET request - function is alive");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: "ok", 
        message: "Ekatva AI Netlify Function is live!",
        timestamp: new Date().toISOString()
      })
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    console.log("🔴 Method not allowed:", event.httpMethod);
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
    console.log("📦 Request body parsed:", body);
  } catch (e) {
    console.log("🔴 Invalid JSON:", e.message);
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: "Bad request JSON" }) 
    };
  }

  const userMessage = body.message;
  if (!userMessage) {
    console.log("🔴 No message provided");
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ error: "No message provided" }) 
    };
  }

  // Detect technical level
  const techLevel = detectTechnicalLevel(userMessage);
  console.log("📊 Detected tech level:", techLevel);

  // Build system prompt
  const systemPrompt = buildSystemPrompt('', { techLevel });
  console.log("🤖 System prompt length:", systemPrompt.length);

  // API Keys from environment
  const apiKeys = [
    { key: process.env.OPENAI_API_KEY, name: "Key 1" },
    { key: process.env.OPENAI_API_KEY2, name: "Key 2" },
    { key: process.env.OPENAI_API_KEY3, name: "Key 3" },
    { key: process.env.OPENAI_API_KEY4, name: "Key 4" }
  ].filter(item => item.key);

  console.log(`🔑 Found ${apiKeys.length} API keys`);

  if (apiKeys.length === 0) {
    console.log("🔴 No API keys found!");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "No API keys configured" })
    };
  }

  const requestBody = {
    model: "openrouter/free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 500,
    stream: false
  };

  const fetchWithTimeout = async (url, options, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

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
      console.log(`📡 ${name} response status:`, res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.log(`🔴 ${name} error:`, errorText);
        throw new Error(`${name} failed: ${res.status}`);
      }
      const data = await res.json();
      console.log(`✅ ${name} success`);
      return { reply: data.choices?.[0]?.message?.content, name };
    })
    .catch(err => {
      console.log(`🔴 ${name} error:`, err.message);
      throw err;
    })
  );

  try {
    console.log("⏳ Waiting for any API to respond...");
    const result = await Promise.any(apiPromises);
    console.log(`✅ Success from ${result.name}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        reply: result.reply,
        api: result.name 
      })
    };
  } catch (error) {
    console.log("🔴 All APIs failed:", error.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ 
        error: "All AI gateways failed. Please try again.",
        details: error.message 
      })
    };
  }
};

function detectTechnicalLevel(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('architecture') || 
      lowerMsg.includes('performance optimization') ||
      lowerMsg.includes('design pattern') ||
      lowerMsg.includes('scalability')) {
    return 'advanced';
  }
  
  if (lowerMsg.includes('how to implement') ||
      lowerMsg.includes('best practice') ||
      lowerMsg.includes('difference between') ||
      lowerMsg.includes('vs ')) {
    return 'intermediate';
  }
  
  return 'beginner';
}
