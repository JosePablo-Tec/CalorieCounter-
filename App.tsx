import React, { useState, useMemo } from 'react';
import { FoodItem, MealType, User } from './types';
import CalorieDisplay from './components/CalorieDisplay';
import FoodList from './components/FoodList';
import FoodForm from './components/FoodForm';
import { HeaderIcon } from './components/icons';
import Auth from './components/Auth';
import TemplateManager from './components/TemplateManager';
import HistoryView from './components/HistoryView';

type View = 'dashboard' | 'templates' | 'history';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [dailyGoal, setDailyGoal] = useState<number>(2000);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());

  const totalCalories = useMemo(() => {
    return foodItems.reduce((sum, item) => sum + item.calories, 0);
  }, [foodItems]);

  const addFoodItem = (name: string, calories: number, meal: MealType) => {
    if (name.trim() === '' || calories <= 0) return;
    const newFood: FoodItem = {
      id: new Date().getTime().toString() + Math.random(),
      name,
      calories,
      meal,
    };
    setFoodItems(prevItems => [...prevItems, newFood]);
  };

  const addMultipleFoodItems = (items: {name: string, calories: number}[], meal: MealType) => {
    const newFoods: FoodItem[] = items.map(item => ({
        id: new Date().getTime().toString() + Math.random(),
        name: item.name,
        calories: item.calories,
        meal: meal
    }));
    setFoodItems(prev => [...prev, ...newFoods]);
    setCurrentView('dashboard'); // Volver al dashboard para ver los cambios
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

  const handleLogin = (email: string) => {
    setUser({ email, name: email.split('@')[0] });
  };

  const handleLogout = () => {
    setUser(null);
    setFoodItems([]);
    setCurrentView('dashboard');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-dark font-sans flex flex-col">
      <header className="bg-primary shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <HeaderIcon />
            <h1 className="text-xl sm:text-2xl font-bold text-white ml-3 hidden sm:block">Contador Inteligente</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">Hola, {user.name}</span>
            <button onClick={handleLogout} className="text-white/80 hover:text-white text-sm underline">Salir</button>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div className="container mx-auto px-4 flex gap-6 overflow-x-auto text-sm sm:text-base">
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`pb-3 px-2 font-medium transition-colors border-b-4 ${currentView === 'dashboard' ? 'border-accent text-white' : 'border-transparent text-white/60 hover:text-white'}`}
            >
                Dashboard
            </button>
            <button 
                onClick={() => setCurrentView('templates')}
                className={`pb-3 px-2 font-medium transition-colors border-b-4 ${currentView === 'templates' ? 'border-accent text-white' : 'border-transparent text-white/60 hover:text-white'}`}
            >
                Plantillas & IA
            </button>
            <button 
                onClick={() => setCurrentView('history')}
                className={`pb-3 px-2 font-medium transition-colors border-b-4 ${currentView === 'history' ? 'border-accent text-white' : 'border-transparent text-white/60 hover:text-white'}`}
            >
                Historial
            </button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 flex-1">
        
        {currentView === 'dashboard' && (
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
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Añadir Alimento</h2>
                    <FoodForm onAddFood={addFoodItem} />
                </div>
                <h2 className="text-xl font-bold mb-4">Registro de Hoy</h2>
                <FoodList items={foodItems} onDelete={deleteFoodItem} />
            </div>
            </div>
        )}

        {currentView === 'templates' && (
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-dark mb-6">Gestión de Plantillas</h2>
                <TemplateManager onAddFromTemplate={addMultipleFoodItems} />
            </div>
        )}

        {currentView === 'history' && (
             <div className="max-w-4xl mx-auto">
                <HistoryView />
             </div>
        )}

      </main>
    </div>
  );
};

export default App;
