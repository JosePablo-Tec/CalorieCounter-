import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FoodItem, MealType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("La variable de entorno API_KEY no está configurada.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getWeightLossTips = async (
  dailyGoal: number,
  totalCalories: number,
  foodItems: FoodItem[]
): Promise<string> => {
  const mealOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Cena', 'Otros'];

  const groupedItems = foodItems.reduce((acc, item) => {
    (acc[item.meal] = acc[item.meal] || []).push(item);
    return acc;
  }, {} as Record<MealType, FoodItem[]>);

  const foodListString = mealOrder
    .map(mealName => {
        const items = groupedItems[mealName];
        if (!items || items.length === 0) return null;
        const itemList = items.map(item => `- ${item.name} (${item.calories} kcal)`).join('\n');
        return `**${mealName}**\n${itemList}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const prompt = `
    Actúa como un nutricionista experto y entrenador de fitness. Mi objetivo es perder peso.
    Aquí están mis datos de hoy:
    - Mi meta de calorías diarias: ${dailyGoal} kcal
    - Calorías consumidas hasta ahora: ${totalCalories} kcal
    - Alimentos que he comido hoy, categorizados por comida:
    ${foodListString || 'No se han registrado alimentos todavía.'}

    Basado en esta información, por favor, proporciona lo siguiente en español con un tono motivador y amigable:
    1.  **Análisis Rápido:** Un análisis breve de mi progreso de hoy. Comenta sobre la distribución de calorías entre comidas si es relevante.
    2.  **Consejos para Optimizar:** De 3 a 5 consejos concisos y accionables para mejorar. Los consejos deben ser prácticos y considerar mis elecciones de alimentos. Si una comida es muy alta o baja en calorías, menciónalo.
    3.  **Sugerencia de Comida:** Una idea para una comida saludable y saciante (la que probablemente siga, como la cena si es mediodía), incluyendo una estimación de calorías y por qué es una buena opción.

    Formatea tu respuesta usando markdown para mayor claridad. Usa los siguientes encabezados exactos:
    ### Análisis Rápido
    ### Consejos para Optimizar
    ### Sugerencia de Comida
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    if (error instanceof Error) {
        return Promise.reject(new Error(`Hubo un problema al contactar al asistente de IA: ${error.message}`));
    }
    return Promise.reject(new Error("Un error inesperado ocurrió al obtener consejos de la IA."));
  }
};
