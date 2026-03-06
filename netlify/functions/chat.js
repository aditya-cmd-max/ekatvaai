// Load the training data
const { buildSystemPrompt } = require('https://aditya-cmd-max.github.io/ekatvaai/chat/ai-training-data.js'); // Adjust path as needed

export const handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: "Ekatva AI Netlify Function is live!" })
    };
  }

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

  // Detect user's technical level from message (simple heuristic)
  const techLevel = detectTechnicalLevel(userMessage);
  
  // Build dynamic system prompt with user context
  const systemPrompt = buildSystemPrompt('', { techLevel });

  const fetchWithTimeout = async (url, options, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  const apiKeys = [
    { key: process.env.OPENAI_API_KEY, name: "Key 1" },
    { key: process.env.OPENAI_API_KEY2, name: "Key 2" },
    { key: process.env.OPENAI_API_KEY3, name: "Key 3" },
    { key: process.env.OPENAI_API_KEY4, name: "Key 4" }
  ].filter(item => item.key);

  const requestBody = {
    model: "openrouter/free",
    messages: [
      { 
        role: "system", 
        content: systemPrompt  // <-- USING THE TRAINING DATA
      },
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 500, // Increased for more detailed responses
    stream: false
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
      if (!res.ok) throw new Error(`${name} failed`);
      const data = await res.json();
      return { reply: data.choices?.[0]?.message?.content, name };
    })
  );

  try {
    const result = await Promise.any(apiPromises);
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

// Helper function to detect technical level
function detectTechnicalLevel(message) {
  const lowerMsg = message.toLowerCase();
  
  // Advanced indicators
  if (lowerMsg.includes('architecture') || 
      lowerMsg.includes('performance optimization') ||
      lowerMsg.includes('design pattern') ||
      lowerMsg.includes('scalability')) {
    return 'advanced';
  }
  
  // Intermediate indicators
  if (lowerMsg.includes('how to implement') ||
      lowerMsg.includes('best practice') ||
      lowerMsg.includes('difference between') ||
      lowerMsg.includes('vs ')) {
    return 'intermediate';
  }
  
  // Default to beginner
  return 'beginner';
}
