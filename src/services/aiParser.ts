export interface AIParsedSOS {
  bloodGroup: string;
  name: string;
  phone: string;
  location: string;
  description: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function parseEmergencyText(text: string): Promise<AIParsedSOS | null> {
  if (!GEMINI_API_KEY) {
    console.error("Missing VITE_GEMINI_API_KEY in environment variables.");
    return null;
  }

  const prompt = `
You are an AI assistant for a life-saving blood donation platform called BloodBee.
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
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error("Gemini API request failed.");
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean up markdown in case the model returns it despite strict instructions
    const jsonStr = rawText.replace(/```(json)?/g, "").trim();
    const parsed = JSON.parse(jsonStr) as AIParsedSOS;
    
    return parsed;
  } catch (err) {
    console.error("AI Parser Error:", err);
    return null;
  }
}
