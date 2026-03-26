/**
 * Centralized AI Client — Powered by Groq (Llama 3.1)
 * All AI features in BloodBee use this single module.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function isAIConfigured(): boolean {
  return !!GROQ_API_KEY;
}

/**
 * Send a single prompt to Llama 3.1 via Groq and return the raw text response.
 */
export async function aiComplete(prompt: string, systemPrompt?: string): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.error('Missing VITE_GROQ_API_KEY in environment variables.');
    return null;
  }

  const messages: { role: string; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API Error:', response.status, errorData);
      throw new Error(`Groq API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error('AI Client Error:', err);
    return null;
  }
}

/**
 * Multi-turn chat with Llama 3.1 via Groq.
 * Accepts an array of { role, content } messages.
 */
export async function aiChat(
  chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.error('Missing VITE_GROQ_API_KEY in environment variables.');
    return null;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq Chat API Error:', response.status, errorData);
      throw new Error(`Groq Chat API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error('AI Chat Error:', err);
    return null;
  }
}
