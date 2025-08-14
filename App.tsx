import React, { useState, useMemo, useCallback } from 'react';
import { FoodItem, MealType } from './types';
import CalorieDisplay from './components/CalorieDisplay';
import FoodList from './components/FoodList';
import FoodForm from './components/FoodForm';
import GeminiAdvisor from './components/GeminiAdvisor';
import { getWeightLossTips } from './services/geminiService';
import { HeaderIcon } from './components/icons';

const App: React.FC = () => {
  const [dailyGoal, setDailyGoal] = useState<number>(2000);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAiAdvice, setIsLoadingAiAdvice] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const totalCalories = useMemo(() => {
    return foodItems.reduce((sum, item) => sum + item.calories, 0);
  }, [foodItems]);

  const addFoodItem = (name: string, calories: number, meal: MealType) => {
    if (name.trim() === '' || calories <= 0) return;
    const newFood: FoodItem = {
      id: new Date().getTime().toString(),
      name,
      calories,
      meal,
    };
    setFoodItems(prevItems => [...prevItems, newFood]);
  };

  const deleteFoodItem = (id: string) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGoal(e.target.value);
  };

  const handleGoalSave = () => {
    const goalValue = parseInt(newGoal, 10);
    if (!isNaN(goalValue) && goalValue > 0) {
      setDailyGoal(goalValue);
      setIsEditingGoal(false);
    }
  };

  const fetchAdvice = useCallback(async () => {
    setIsLoadingAiAdvice(true);
    setError('');
    setAiAdvice('');
    try {
      const advice = await getWeightLossTips(dailyGoal, totalCalories, foodItems);
      setAiAdvice(advice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Un error desconocido ocurrió al obtener consejos.');
    } finally {
      setIsLoadingAiAdvice(false);
    }
  }, [dailyGoal, totalCalories, foodItems]);

  return (
    <div className="min-h-screen bg-slate-50 text-dark font-sans">
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-center">
          <HeaderIcon />
          <h1 className="text-2xl sm:text-3xl font-bold text-white ml-3">Contador de Calorías Inteligente</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-center">Resumen Diario</h2>
              <CalorieDisplay total={totalCalories} goal={dailyGoal} />
              <div className="mt-6 text-center">
                {isEditingGoal ? (
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="number"
                      value={newGoal}
                      onChange={handleGoalChange}
                      className="w-32 text-center p-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <button 
                      onClick={handleGoalSave}
                      className="bg-primary text-white px-4 py-1 rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-lg">
                      <span className="font-semibold">{dailyGoal.toLocaleString()}</span>
                      <span className="text-sm text-gray-500"> kcal</span>
                    </p>
                    <button 
                      onClick={() => setIsEditingGoal(true)}
                      className="text-sm text-primary hover:underline mt-1"
                    >
                      Ajustar Meta
                    </button>
                  </div>
                )}
              </div>
            </div>

            <GeminiAdvisor
                onGetAdvice={fetchAdvice}
                advice={aiAdvice}
                isLoading={isLoadingAiAdvice}
                error={error}
            />
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-xl font-bold mb-4">Añadir Alimento</h2>
                <FoodForm onAddFood={addFoodItem} />
            </div>
            <h2 className="text-xl font-bold mb-4">Registro de Comidas</h2>
            <FoodList items={foodItems} onDelete={deleteFoodItem} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
