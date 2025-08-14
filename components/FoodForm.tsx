import React, { useState } from 'react';
import { PlusIcon } from './icons';
import { MealType } from '../types';

interface FoodFormProps {
  onAddFood: (name: string, calories: number, meal: MealType) => void;
}

const mealTypes: MealType[] = ['Desayuno', 'Almuerzo', 'Cena', 'Otros'];

const FoodForm: React.FC<FoodFormProps> = ({ onAddFood }) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [meal, setMeal] = useState<MealType>('Desayuno');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calorieValue = parseInt(calories, 10);
    if (name.trim() && !isNaN(calorieValue) && calorieValue > 0) {
      onAddFood(name.trim(), calorieValue, meal);
      setName('');
      setCalories('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="food-name" className="block text-sm font-medium text-gray-700 mb-1">
            Alimento
          </label>
          <input
            id="food-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Ensalada César"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
            Calorías (kcal)
          </label>
          <input
            id="calories"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="Ej: 350"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>
      
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">Tipo de Comida</legend>
        <div className="flex flex-wrap gap-2">
            {mealTypes.map((mealType) => (
                <div key={mealType}>
                    <input
                        type="radio"
                        id={`meal-${mealType}`}
                        name="meal-type"
                        value={mealType}
                        checked={meal === mealType}
                        onChange={() => setMeal(mealType)}
                        className="sr-only peer"
                    />
                    <label
                        htmlFor={`meal-${mealType}`}
                        className="cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors border border-gray-200 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary shadow-sm bg-gray-50 text-gray-700 hover:bg-gray-200"
                    >
                        {mealType}
                    </label>
                </div>
            ))}
        </div>
    </fieldset>

      <button
        type="submit"
        className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-lg hover:bg-opacity-90 transition-transform duration-200 ease-in-out flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        <PlusIcon />
        <span>Añadir Alimento</span>
      </button>
    </form>
  );
};

export default FoodForm;
