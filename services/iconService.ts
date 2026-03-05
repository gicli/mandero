import { GoogleGenAI } from "@google/genai";

export const generateAppIcon = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: 'A professional iOS app icon for a mobile alarm app called "Mamdaero Alarm". The icon features a minimalist, modern alarm clock with a friendly, slightly hand-drawn "sketch" aesthetic. The background is a soft pastel purple. The clock face is a warm off-white with simple black hands. The design is clean, centered, and follows Apple\'s Human Interface Guidelines for icons. High resolution, soft 3D depth, premium matte finish, centered composition.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
