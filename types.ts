export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Otros';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  meal: MealType;
}
