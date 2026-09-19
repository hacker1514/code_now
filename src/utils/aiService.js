import axios from "axios";

/**
 * Returns initial system context configured strictly for Code Now AI
 */
export function getCodeNowSystemContext() {
  return [
    {
      role: "user",
      content:
        "[System Instruction: You are Code Now AI, the official AI coding assistant for the Code Now IDE platform. Identify yourself ONLY as Code Now AI. Focus exclusively on programming, code analysis, debugging, algorithms, time/space complexity, and software development. Never mention courses, assessments, or job platforms.]",
    },
    {
      role: "assistant",
      content:
        "Understood! I am Code Now AI, your dedicated programming assistant for Code Now. I focus strictly on code analysis, debugging, algorithm optimizations, and software development.",
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

  // 3. Format message with Code Now AI system directive wrapper
  const formattedMessage = `[System Directive: Respond strictly as Code Now AI. Focus exclusively on coding, debugging, and software development.]\n${message}`;

  const payload = { message: formattedMessage, context: slicedContext };

  // Attempt 1: Vite dev server proxy (/api/ai/chat)
  try {
    const response = await axios.post("/api/ai/chat", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 25000,
    });
    if (response.data && response.data.message) {
      return response.data.message;
    }
  } catch (proxyErr) {
    console.warn("Code Now AI Proxy Failed, attempting CORS proxy fallback...", proxyErr?.message);

    // Attempt 2: CORS Proxy fallback for static production servers
    try {
      const fallbackUrl =
        "https://corsproxy.io/?" + encodeURIComponent("https://naipunyam-chatbot.rnit.ai/api/chat");
      const fallbackRes = await axios.post(fallbackUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 25000,
      });
      if (fallbackRes.data && fallbackRes.data.message) {
        return fallbackRes.data.message;
      }
    } catch (fallbackErr) {
      console.warn("CORS Proxy Failed, attempting direct endpoint...", fallbackErr?.message);

      // Attempt 3: Direct API endpoint
      try {
        const directRes = await axios.post("https://naipunyam-chatbot.rnit.ai/api/chat", payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 25000,
        });
        if (directRes.data && directRes.data.message) {
          return directRes.data.message;
        }
      } catch (directErr) {
        throw new Error(
          directErr.response?.data?.message ||
            directErr.message ||
            "Failed to communicate with Code Now AI engine."
        );
      }
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
