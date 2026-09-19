import axios from "axios";

/**
 * Returns initial system context configured strictly for Code Now AI
 */
export function getCodeNowSystemContext() {
  return [
    {
      role: "user",
      content:
        "[System Instruction: You are Code Now AI, a friendly, intelligent AI programming assistant for the Code Now IDE. Respond naturally to general greetings like 'hi' or 'hello'. Answer programming questions, explain algorithms, help debug code, and assist with software development concisely and naturally.]",
    },
    {
      role: "assistant",
      content:
        "Hello! I am Code Now AI, your programming assistant. How can I help you with your code or programming questions today?",
    },
  ];
}

/**
 * Sends a message to the AI engine, sending strictly max 5 recent chat messages for optimal performance
 */
export async function sendCodeNowAIMessage(message, context = []) {
  // 1. Ensure initial system context is seeded if empty
  let baseContext = context.length === 0 ? getCodeNowSystemContext() : context;

  // 2. STRICT PERFORMANCE OPTIMIZATION: Only send the last 5 messages in context
  const slicedContext = baseContext.slice(-5);

  const formattedMessages = [
    {
      role: "system",
      content: "You are Code Now AI, an intelligent, helpful AI programming assistant for the Code Now IDE. Respond naturally and conversationally. Answer programming questions, explain concepts, debug errors, and write clean code."
    },
    ...slicedContext.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  // In production (e.g. GitHub Pages), call high-speed CORS-enabled AI engine directly for INSTANT (<1s) response
  if (!import.meta.env.DEV) {
    try {
      const fastRes = await axios.post("https://text.pollinations.ai/", {
        messages: formattedMessages,
        model: "openai"
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      });

      if (fastRes.data) {
        const reply = typeof fastRes.data === "string" ? fastRes.data : JSON.stringify(fastRes.data);
        if (reply.trim()) return reply.trim();
      }
    } catch (fastErr) {
      console.warn("High-speed AI engine attempt failed, trying fallbacks:", fastErr?.message);
    }
  }

  // Local development / fallback attempt
  const payload = { message: message, context: slicedContext };
  const endpoints = [
    "/api/ai/chat",
    "https://naipunyam-chatbot.rnit.ai/api/chat",
    "https://text.pollinations.ai/"
  ];

  for (const endpoint of endpoints) {
    try {
      if (endpoint.includes("pollinations.ai")) {
        const res = await axios.post(endpoint, { messages: formattedMessages, model: "openai" }, { timeout: 15000 });
        if (res.data) {
          const reply = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
          if (reply.trim()) return reply.trim();
        }
      } else {
        const response = await axios.post(endpoint, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 3000,
        });
        if (response.data && response.data.message) {
          return response.data.message;
        }
      }
    } catch (err) {
      console.warn(`Code Now AI endpoint ${endpoint} attempt failed:`, err?.message);
    }
  }

  throw new Error("Failed to receive response from Code Now AI engine.");
}

/**
 * Performs AI code analysis focused strictly on coding, bugs, and performance
 */
export async function analyzeCodeWithCodeNowAI({ code, language, executionResult, context = [] }) {
  let prompt = `Please analyze the following ${language.toUpperCase()} code for logic bugs, syntax errors, time/space complexity (Big-O), and performance optimizations:

Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\``;

  if (executionResult && executionResult.output) {
    prompt += `\n\nExecution Output / Error Logs:
\`\`\`
${executionResult.output}
\`\`\``;
  }

  return await sendCodeNowAIMessage(prompt, context);
}

/**
 * Explains and fixes code execution errors
 */
export async function explainErrorWithCodeNowAI({ code, language, errorText, context = [] }) {
  const prompt = `The following ${language.toUpperCase()} code produced an error during execution. Explain the root cause of the error line-by-line and provide the fully corrected code:

Error Log:
\`\`\`
${errorText}
\`\`\`

Original Code:
\`\`\`${language}
${code}
\`\`\``;

  return await sendCodeNowAIMessage(prompt, context);
}
