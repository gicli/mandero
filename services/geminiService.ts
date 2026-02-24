
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAffirmation = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, cheerful 1-sentence morning affirmation or alarm greeting in Korean.",
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "좋은 아침이에요! 오늘도 힘차게 시작해봐요.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "오늘 하루도 당신의 빛나는 시간으로 채워지길 바랍니다.";
  }
};
