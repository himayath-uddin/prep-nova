export const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";
export const DEFAULT_MODEL = "qwen2.5:3b";

export async function askAI(
  message: string,
  systemPrompt?: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout for model loading

  try {
    const payload: any = {
      model,
      prompt: message,
      stream: false,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const response = await fetch(OLLAMA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Ollama connection failed:", error);

    // Fallback response if Ollama is unreachable or times out
    if (error.name === "AbortError") {
      return "I'm having trouble connecting to my local logic core. The connection timed out. Could you repeat your answer?";
    }

    return "It seems my local AI service is currently unavailable. Please make sure Ollama is running and configured correctly on localhost.";
  }
}
