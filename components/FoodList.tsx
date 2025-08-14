
import React from 'react';
import { FoodItem, MealType } from '../types';
import { DeleteIcon } from './icons';

interface FoodListProps {
  items: FoodItem[];
  onDelete: (id: string) => void;
}

const mealOrder: MealType[] = ['Desayuno', 'Almuerzo', 'Cena', 'Otros'];

const FoodList: React.FC<FoodListProps> = ({ items, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
        <p className="text-gray-500 font-medium">Tu registro de comidas está vacío.</p>
        <p className="text-gray-400 text-sm mt-1">Usa el formulario de arriba para añadir tu primera comida.</p>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    (acc[item.meal] = acc[item.meal] || []).push(item);
    return acc;
  }, {} as Record<MealType, FoodItem[]>);

  return (
    <div className="space-y-6 max-h-[350px] lg:max-h-[500px] overflow-y-auto pr-3 -mr-3">
      {mealOrder.map(mealName => {
        const mealItems = groupedItems[mealName] || [];
        if(mealItems.length === 0) return null; // No renderizar la sección si no hay items
        
        const mealTotalCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);

        return (
          <div key={mealName}>
            <div className="flex justify-between items-baseline mb-3 border-b-2 border-gray-200 pb-2">
              <h3 className="text-lg font-bold text-dark">{mealName}</h3>
              <p className="font-semibold text-gray-600">{mealTotalCalories.toLocaleString()} kcal</p>
            </div>
            <div className="space-y-2">
              {mealItems.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-slate-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-semibold text-dark">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">{item.calories.toLocaleString()} kcal</span>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
                      aria-label={`Eliminar ${item.name}`}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FoodList;