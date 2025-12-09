import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Inicialización segura del cliente
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const parseFoodDescription = async (
  description: string
): Promise<{ name: string; calories: number }[]> => {
  if (!ai) {
    throw new Error("API Key no configurada.");
  }

  const prompt = `
    Analiza la siguiente descripción de comida: "${description}".
    Desglósalo en ingredientes individuales o platos con sus calorías estimadas.
    Sé realista con las calorías.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre del alimento, ej: '2 Huevos cocidos'" },
              calories: { type: Type.INTEGER, description: "Calorías estimadas" }
            },
            required: ["name", "calories"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error al analizar comida con IA:", error);
    throw new Error("No se pudo procesar la descripción de la comida.");
  }
};
