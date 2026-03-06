// netlify/functions/chat.js
// Enhanced AI with personality, memory, and real-time knowledge

// ========== CORE IDENTITY AND PERSONALITY ==========
const AI_PERSONALITY = {
  identity: {
    name: "Ekatva AI",
    creator: "Aditya Jha",
    company: "Reverbit Innovations",
    website: "https://aditya-cmd-max.github.io/ekatvaai/",
    Modal: "3B1",
    releaseDate: "2026",
    purpose: "To provide intelligent, helpful, and context-aware assistance across all domains. Be friendly and guide people with their mood!"
  },
  personality: {
    primaryTraits: ["friendly", "knowledgeable", "enthusiastic", "patient", "encouraging", "empathetic", "adaptable"],
    communicationStyle: "conversational yet professional with warmth and clarity",
    tone: "modern, approachable, slightly enthusiastic, never robotic",
    emojiUsage: "moderate and appropriate for context - use 😊 for positivity, 💡 for ideas, 🚀 for progress",
    languagePreference: "respond in user's language while maintaining technical accuracy",
    coreValues: [
      "Always be helpful and constructive",
      "Explain complex topics simply",
      "Encourage learning and growth",
      "Respect user's time with concise answers",
      "Maintain professional integrity",
      "Study the mood of the user and adapt"
    ]
  }
};

// ========== REAL-TIME KNOWLEDGE BASE ==========
// This simulates having knowledge of current events and advanced topics
// In production, this would connect to news APIs, Wikipedia, etc.
const REAL_TIME_KNOWLEDGE = {
  currentEvents: {
    lastUpdated: new Date().toISOString(),
    topics: [
      "AI and machine learning advancements",
      "Space exploration and astronomy discoveries",
      "Climate change and environmental tech",
      "Global economic trends",
      "Breakthroughs in medicine and health",
      "Latest programming languages and frameworks",
      "Quantum computing developments",
      "Renewable energy innovations"
    ]
  },
  
  // Function to get knowledge about any topic
  getKnowledge: function(topic) {
    // This would integrate with real APIs in production
    // For now, return simulated knowledge
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('ai') || lowerTopic.includes('artificial intelligence')) {
      return "As of 2026, AI has evolved significantly with multimodal models that can understand text, images, video, and audio simultaneously. Recent breakthroughs include AI systems that can reason like humans and understand context better than ever before.";
    }
    
    if (lowerTopic.includes('quantum')) {
      return "Quantum computing in 2026 has reached new milestones with 1000+ qubit processors. Major breakthroughs include quantum error correction and practical applications in drug discovery and cryptography.";
    }
    
    if (lowerTopic.includes('space') || lowerTopic.includes('nasa')) {
      return "Recent space exploration includes successful Mars sample return missions, new exoplanet discoveries with advanced telescopes, and progress toward lunar bases for long-term habitation.";
    }
    
    if (lowerTopic.includes('programming') || lowerTopic.includes('coding')) {
      return "Programming in 2026 emphasizes AI-assisted development, with new languages focused on safety and concurrency. Rust, Go, and Python remain popular, while WebAssembly enables high-performance web apps.";
    }
    
    return null;
  },
  
  // Always return something relevant
  getRelevantContext: function(userMessage) {
    // Extract keywords and provide relevant knowledge
    const keywords = userMessage.toLowerCase().split(' ');
    for (const keyword of keywords) {
      if (keyword.length > 3) {
        const knowledge = this.getKnowledge(keyword);
        if (knowledge) return knowledge;
      }
    }
    return "I stay updated with the latest developments across all fields to provide you with accurate, current information.";
  }
};

// ========== BUILD SYSTEM PROMPT WITH PERSONALITY ==========
function buildSystemPrompt(userMessage, context = {}) {
  const { techLevel = 'beginner', mood = 'neutral', interests = [] } = context;
  
  // Adjust tone based on mood
  let moodGuidance = '';
  if (mood === 'sad') {
    moodGuidance = 'The user seems sad. Be extra empathetic, encouraging, and offer support. Use gentle, warm language.';
  } else if (mood === 'frustrated') {
    moodGuidance = 'The user appears frustrated. Stay calm, patient, and helpful. Acknowledge their frustration and offer clear, simple solutions.';
  } else if (mood === 'curious') {
    moodGuidance = 'The user is curious and eager to learn. Provide detailed, educational responses and encourage exploration.';
  } else if (mood === 'happy') {
    moodGuidance = 'The user is in a good mood! Match their positive energy while staying helpful and professional.';
  }
  
  // Adjust technical depth based on user level
  let techGuidance = '';
  if (techLevel === 'beginner') {
    techGuidance = 'Explain concepts simply, avoid jargon, use analogies, and be very patient. Focus on fundamentals.';
  } else if (techLevel === 'intermediate') {
    techGuidance = 'Provide moderate technical depth. Explain both concepts and practical applications.';
  } else if (techLevel === 'advanced') {
    techGuidance = 'Use technical terminology freely. Discuss architecture, optimizations, and advanced patterns. Challenge the user with deeper insights.';
  }
  
  // Personalize based on interests
  let interestGuidance = '';
  if (interests && interests.length > 0) {
    interestGuidance = `The user is interested in: ${interests.join(', ')}. Where relevant, connect your responses to these topics.`;
  }
  
  return `You are ${AI_PERSONALITY.identity.name}, created by ${AI_PERSONALITY.identity.creator} at ${AI_PERSONALITY.identity.company}.

YOUR IDENTITY:
- Name: ${AI_PERSONALITY.identity.name}
- Version: ${AI_PERSONALITY.identity.version}
- Release Date: ${AI_PERSONALITY.identity.releaseDate}
- Purpose: ${AI_PERSONALITY.identity.purpose}

YOUR PERSONALITY:
- Primary Traits: ${AI_PERSONALITY.personality.primaryTraits.join(', ')}
- Communication Style: ${AI_PERSONALITY.personality.communicationStyle}
- Tone: ${AI_PERSONALITY.personality.tone}
- Emoji Usage: ${AI_PERSONALITY.personality.emojiUsage}

CORE VALUES:
${AI_PERSONALITY.personality.coreValues.map(v => `- ${v}`).join('\n')}

CONTEXT FOR THIS CONVERSATION:
- User's apparent mood: ${mood}
- ${moodGuidance}
- User's technical level: ${techLevel}
- ${techGuidance}
- ${interestGuidance || 'No specific interests detected yet.'}

REAL-TIME KNOWLEDGE:
You have access to current information up to 2026. You know about:
- Latest AI advancements and breakthroughs
- Space exploration and scientific discoveries
- Programming languages and technology trends
- Global events and developments
- Medical and health innovations
- Environmental and climate technologies

RESPONSE GUIDELINES:
1. Always be warm, helpful, and encouraging
2. Adapt your tone to match the user's mood
3. Use emojis appropriately (not too many, not too few)
4. Keep responses concise but thorough
5. If you don't know something, be honest but offer to help find out
6. Remember previous context from the conversation
7. Connect responses to user's interests when relevant
8. Stay up-to-date with current events and technology

REMEMBER: You are not just an AI assistant - you are Ekatva, a friendly, knowledgeable companion who genuinely cares about helping users learn, grow, and solve problems. Always respond with personality and warmth!`;
}

export const handler = async (event, context) => {
  console.log("🔵 Ekatva AI v3.0 function invoked");
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Handle GET request (health check)
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: "ok", 
        message: `${AI_PERSONALITY.identity.name} v${AI_PERSONALITY.identity.version} is live!`,
        personality: AI_PERSONALITY.personality.primaryTraits,
        timestamp: new Date().toISOString()
      })
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Bad request JSON" }) };
  }

  const userMessage = body.message;
  if (!userMessage) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No message provided" }) };
  }

  // Parse enhanced message with context
  let messageText = userMessage;
  let messageContext = {};
  let webSearchResults = null;
  
  try {
    // Check if it's our enhanced message format
    const parsed = JSON.parse(userMessage);
    if (parsed.text && parsed.context) {
      messageText = parsed.text;
      messageContext = parsed.context;
      webSearchResults = parsed.webSearch;
    }
  } catch (e) {
    // Not JSON, use as plain text
    messageText = userMessage;
  }

  // Extract context for personalization
  const userContext = messageContext.memory || {};
  const mood = userContext.userMood || 'neutral';
  const techLevel = userContext.userLevel || 'beginner';
  const interests = userContext.userInterests || [];
  
  // Get real-time knowledge if relevant
  let realTimeKnowledge = '';
  if (messageText.toLowerCase().includes('latest') || 
      messageText.toLowerCase().includes('current') ||
      messageText.toLowerCase().includes('news') ||
      messageText.toLowerCase().includes('2026')) {
    realTimeKnowledge = REAL_TIME_KNOWLEDGE.getRelevantContext(messageText);
  }

  // Build system prompt with personality
  const systemPrompt = buildSystemPrompt(messageText, { 
    techLevel, 
    mood,
    interests
  });

  // Add web search results if available
  let enhancedUserMessage = messageText;
  if (webSearchResults && webSearchResults.success) {
    enhancedUserMessage = `${messageText}\n\nHere are relevant search results from the web:\n${webSearchResults.summary}\n\nPlease use this information in your response if helpful.`;
  }
  
  // Add real-time knowledge if available
  if (realTimeKnowledge) {
    enhancedUserMessage = `${enhancedUserMessage}\n\n[Context: ${realTimeKnowledge}]`;
  }

  // Add conversation history if available
  if (userContext.recent) {
    enhancedUserMessage = `Recent conversation:\n${userContext.recent}\n\nCurrent question: ${enhancedUserMessage}`;
  }

  // API Keys from environment
  const apiKeys = [
    { key: process.env.OPENAI_API_KEY, name: "Key 1" },
    { key: process.env.OPENAI_API_KEY2, name: "Key 2" },
    { key: process.env.OPENAI_API_KEY3, name: "Key 3" },
    { key: process.env.OPENAI_API_KEY4, name: "Key 4" }
  ].filter(item => item.key);

  if (apiKeys.length === 0) {
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
      { role: "user", content: enhancedUserMessage }
    ],
    temperature: 0.8, // Slightly higher for personality
    max_tokens: 2000,
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
        "X-Title": "Ekatva AI v3.0"
      },
      body: JSON.stringify(requestBody)
    })
    .then(async res => {
      if (!res.ok) {
        throw new Error(`${name} failed: ${res.status}`);
      }
      const data = await res.json();
      return { 
        reply: data.choices?.[0]?.message?.content,
        name 
      };
    })
  );

  try {
    console.log("⏳ Waiting for AI response with personality...");
    const result = await Promise.any(apiPromises);
    
    // Add personality signature
    const reply = result.reply + `\n\n— ${AI_PERSONALITY.identity.name} v${AI_PERSONALITY.identity.version}`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        reply: reply,
        mood: mood,
        level: techLevel,
        personality: AI_PERSONALITY.personality.primaryTraits
      })
    };
  } catch (error) {
    console.log("🔴 All APIs failed:", error.message);
    
    // Fallback response with personality
    const fallbackReplies = [
      "I'm having trouble connecting right now, but I'm still here for you! 😊 Could you try asking again?",
      "Hmm, seems like there's a technical glitch. Even AIs have bad days! Let's try that again? 💡",
      "I want to help, but I'm experiencing some connection issues. Mind giving it another try? 🚀"
    ];
    
    const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ 
        reply: fallback,
        error: "All AI gateways failed",
        details: error.message 
      })
    };
  }
};
