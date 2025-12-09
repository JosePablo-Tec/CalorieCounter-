export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Otros';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  meal: MealType;
}

export interface FoodTemplate {
  id: string;
  name: string; // Ej: "Mi Desayuno Fitness"
  items: Omit<FoodItem, 'id' | 'meal'>[]; // Lista de items predefinidos sin ID ni momento específico
  totalCalories: number;
}

export interface DailyHistory {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  goal: number;
  items: FoodItem[];
}

export interface User {
  email: string;
  name: string;
}
