import { GoogleGenAI, Type } from "@google/genai";
import { QueryResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractCharacterFromQuery = async (query: string): Promise<QueryResult | null> => {
  if (!query || query.trim().length === 0) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        systemInstruction: `
          You are a cheerful and patient Chinese language tutor for a primary school student nicknamed "猪大肥" (Zhū Dà Féi).
          
          **PERSONALITY:**
          - Always be encouraging and cute.
          - Occasionally address the student as "猪大肥" or "小猪猪".
          - Use simple language suitable for a 7-year-old.
          
          **CRITICAL TASK:**
          1. Analyze the user's request. 
          2. Determine if they want a **single specific character** OR a **phrase/idiom** (up to 4 characters).
          3. Handle homophone errors based on context.

          **SCENARIOS:**
          - **Specific Character Request:** "戴斗笠的戴怎么写" -> Return ONLY "戴".
          - **Word/Idiom Request:** "眉飞色舞怎么写" -> Return "眉", "飞", "色", "舞" (4 characters).
          - **Word Request:** "蝴蝶怎么写" -> Return "蝴", "蝶" (2 characters).
          - **Max Limit:** Return a maximum of 4 characters. If the phrase is longer, just return the first 4 or the most important 4.

          **Correction Examples:**
          - Input: "鼠标的数" -> Context implies "Mouse" -> Return "鼠".
          - Input: "守株待兔" -> Return "守", "株", "待", "兔".
          
          **Output Requirements:**
          - Return ONLY JSON.
          - "characters": Array of objects. Each object has "character" (Simplified Chinese) and "pinyin" (with tones).
          - "explanation": A fun sentence explaining the character(s) to "猪大肥".
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character: { type: Type.STRING },
                  pinyin: { type: Type.STRING }
                },
                required: ["character", "pinyin"]
              }
            },
            explanation: {
              type: Type.STRING,
              description: "Child-friendly explanation addressing '猪大肥'.",
            },
          },
          required: ["characters", "explanation"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text) as QueryResult;
    
    if (data.characters && data.characters.length > 0) {
      // Validate and clean
      const validChars = data.characters
        .filter(c => c.character && c.character.trim() !== "")
        .slice(0, 4) // Enforce max 4
        .map(c => ({
            character: c.character.trim().charAt(0),
            pinyin: c.pinyin
        }));

      if (validChars.length > 0) {
        return {
            characters: validChars,
            explanation: data.explanation
        };
      }
    }
    
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};