import { aiComplete, isAIConfigured } from './aiClient';

export interface AIParsedSOS {
  bloodGroup: string;
  name: string;
  phone: string;
  location: string;
  description: string;
}

export async function parseEmergencyText(text: string): Promise<AIParsedSOS | null> {
  if (!isAIConfigured()) {
    console.error("Missing VITE_GROQ_API_KEY in environment variables.");
    return null;
  }

  const prompt = `You are an AI assistant for a life-saving blood donation platform called BloodBee.
Extract the following emergency details from the user's raw message.
Message: "${text}"

Rules:
- Blood group must be strictly one of: O+, O-, A+, A-, B+, B-, AB+, AB-. If unknown or unmentioned, return "".
- Extract Phone if it looks like a number.
- Location should be the hospital name or area mentioned.
- Provide a concise 1-sentence description based on their panic/context.
- YOU MUST RETURN ONLY VALID JSON without any markdown formatting or \`\`\`json block.

Required fields in JSON:
{
  "bloodGroup": "",
  "name": "",
  "phone": "",
  "location": "",
  "description": ""
}`;

  try {
    const rawText = await aiComplete(prompt);
    if (!rawText) return null;

    // Clean up markdown in case the model returns it despite strict instructions
    const jsonStr = rawText.replace(/```(json)?/g, "").trim();
    const parsed = JSON.parse(jsonStr) as AIParsedSOS;
    
    return parsed;
  } catch (err) {
    console.error("AI Parser Error:", err);
    return null;
  }
}
