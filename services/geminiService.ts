
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const searchPriceList = async (query: string, region: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Agisci come un esperto di computo metrico italiano. Cerca nel prezziario regionale della ${region} le voci più pertinenti per: "${query}". Fornisci una lista di codici e descrizioni verosimili.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              description: { type: Type.STRING },
              unit: { type: Type.STRING },
              price: { type: Type.NUMBER },
            },
            required: ["code", "description", "unit", "price"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};

export const analyzeBudget = async (projectData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analizza questo cantiere edile e fornisci suggerimenti su budget e margini: ${JSON.stringify(projectData)}`,
    });
    return response.text;
  } catch (error) {
    return "Impossibile analizzare i dati al momento.";
  }
};
