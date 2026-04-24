import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FoodItem, FoodTemplate, MealType, DailyHistory } from './types';
import CalorieDisplay from './components/CalorieDisplay';
import FoodList from './components/FoodList';
import FoodForm from './components/FoodForm';
import { HeaderIcon } from './components/icons';
import Auth from './components/Auth';
import TemplateManager from './components/TemplateManager';
import HistoryView from './components/HistoryView';
import { uuid } from './utils/uuid';
import { withTimeout } from './utils/withTimeout';
import {
  signOut,
  getAuthStatus,
  subscribeToAuthChanges,
  saveGoal,
  loadFoodItems, insertFoodItem, insertFoodItems, deleteFoodItemById,
  loadTemplates, saveTemplates,
  loadHistory,
  loadProfile,
} from './services/dataService';

type View      = 'dashboard' | 'templates' | 'history';
type AppStatus = 'loading' | 'signed-out' | 'needs-name' | 'ready';

const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [today, setToday] = useState(getTodayString);

  const [appStatus, setAppStatus]   = useState<AppStatus>('loading');
  const [userName, setUserName]     = useState('');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [dailyGoal, setDailyGoal]   = useState<number>(2000);
  const [foodItems, setFoodItems]   = useState<FoodItem[]>([]);
  const [templates, setTemplates]   = useState<FoodTemplate[]>([]);
  const [history, setHistory]       = useState<DailyHistory[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal]       = useState('2000');

  // Evita que los efectos de persistencia reescriban los datos que acabamos de leer.
  const hydratedRef = useRef(false);

  // ── Auth + carga inicial ───────────────────────────────────────────────────

  const checkStatus = useCallback(async () => {
    try {
      const { hasSession, emailVerified } = await withTimeout(getAuthStatus(), 8000, 'getAuthStatus');
      if (!hasSession || !emailVerified) {
        hydratedRef.current = false;
        setAppStatus('signed-out');
        return;
      }
      const { name, dailyGoal: goal } = await withTimeout(loadProfile(), 8000, 'loadProfile');
      setUserName(name);
      if (!name) {
        setAppStatus('needs-name');
        return;
      }
      const [items, tpls, hist] = await withTimeout(
        Promise.all([loadFoodItems(today), loadTemplates(), loadHistory(goal)]),
        12000,
        'loadAll',
      );
      hydratedRef.current = false;
      setDailyGoal(goal);
      setNewGoal(goal.toString());
      setFoodItems(items);
      setTemplates(tpls);
      setHistory(hist);
      setAppStatus('ready');
    } catch (err) {
      console.error('checkStatus error:', err);
      setAppStatus('signed-out');
    }
  }, [today]);

  useEffect(() => {
    checkStatus();
    const subscription = subscribeToAuthChanges(checkStatus);
    return () => subscription.unsubscribe();
  }, [checkStatus]);

  // ── Detección de cambio de día ────────────────────────────────────────────

  useEffect(() => {
    if (appStatus !== 'ready') return;
    const checkDay = async () => {
      const newToday = getTodayString();
      if (newToday === today) return;
      const items = await loadFoodItems(newToday);
      setFoodItems(items);
      setToday(newToday);
    };
    const interval = setInterval(checkDay, 60_000);
    const handleVisibility = () => { if (document.visibilityState === 'visible') void checkDay(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [today, appStatus]);

  // ── Callbacks de auth ──────────────────────────────────────────────────────

  const handleNameSaved = useCallback(async (name: string) => {
    setUserName(name);
    try {
      const { dailyGoal: goal } = await withTimeout(loadProfile(), 8000, 'loadProfile (name saved)');
      const [items, tpls, hist] = await withTimeout(
        Promise.all([loadFoodItems(today), loadTemplates(), loadHistory(goal)]),
        12000,
        'loadAll (name saved)',
      );
      hydratedRef.current = false;
      setDailyGoal(goal);
      setNewGoal(goal.toString());
      setFoodItems(items);
      setTemplates(tpls);
      setHistory(hist);
      setAppStatus('ready');
    } catch (err) {
      console.error('handleNameSaved error:', err);
      setAppStatus('signed-out');
    }
  }, [today]);

  const handleSignOut = useCallback(async () => {
    setAppStatus('signed-out');
    setUserName('');
    setFoodItems([]);
    setTemplates([]);
    setHistory([]);
    try {
      await signOut();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }, []);

  // ── Historial en memoria (sin escritura a DB: los items se persisten granularmente)

  useEffect(() => {
    if (appStatus !== 'ready') return;
    const total = foodItems.reduce((s, i) => s + i.calories, 0);
    const record: DailyHistory = { date: today, totalCalories: total, goal: dailyGoal, items: foodItems };
    setHistory(prev => {
      const idx = prev.findIndex(h => h.date === today);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = record;
        return updated;
      }
      return [record, ...prev];
    });
  }, [foodItems, today, dailyGoal, appStatus]);

  // ── Persistencia (salta el primer render tras la hidratación) ─────────────

  useEffect(() => {
    if (appStatus !== 'ready') return;
    if (!hydratedRef.current) return;
    void saveGoal(dailyGoal);
  }, [dailyGoal, appStatus]);

  useEffect(() => {
    if (appStatus !== 'ready') return;
    if (!hydratedRef.current) return;
    void saveTemplates(templates);
  }, [templates, appStatus]);

  // Marca la hidratación como completa DESPUÉS de que los efectos anteriores
  // hayan visto hydratedRef=false en su primer run. Declarado último a propósito.
  useEffect(() => {
    if (appStatus === 'ready') hydratedRef.current = true;
  }, [appStatus, foodItems, dailyGoal, templates]);

  // ── Lógica de alimentos ────────────────────────────────────────────────────

  const totalCalories = useMemo(
    () => foodItems.reduce((sum, item) => sum + item.calories, 0),
    [foodItems]
  );

  const addFoodItem = useCallback((name: string, calories: number, meal: MealType) => {
    if (!name.trim() || calories <= 0) return;
    const newFood: FoodItem = { id: uuid(), name: name.trim(), calories, meal };
    setFoodItems(prev => [...prev, newFood]);
    void insertFoodItem(today, newFood);
  }, [today]);

  const addMultipleFoodItems = useCallback((items: { name: string; calories: number }[], meal: MealType) => {
    const newFoods: FoodItem[] = items.map(item => ({
      id: uuid(),
      name: item.name,
      calories: item.calories,
      meal,
    }));
    setFoodItems(prev => [...prev, ...newFoods]);
    setCurrentView('dashboard');
    void insertFoodItems(today, newFoods);
  }, [today]);

  const deleteFoodItem = useCallback((id: string) => {
    setFoodItems(prev => prev.filter(item => item.id !== id));
    void deleteFoodItemById(id);
  }, []);

  const handleGoalSave = () => {
    const value = parseInt(newGoal, 10);
    if (!isNaN(value) && value > 0) {
      setDailyGoal(value);
      setIsEditingGoal(false);
    }
  };

  const handleSaveTemplate = useCallback((template: FoodTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = template;
        return updated;
      }
      return [...prev, template];
    });
  }, []);

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (appStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (appStatus === 'signed-out' || appStatus === 'needs-name') {
    return (
      <Auth
        view={appStatus === 'signed-out' ? 'auth' : 'name-entry'}
        onAuthenticated={checkStatus}
        onNameSaved={handleNameSaved}
      />
    );
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
            <span className="text-white text-sm font-medium">Hola, {userName}</span>
            <button
              onClick={handleSignOut}
              className="text-white/70 hover:text-white text-xs border border-white/30 hover:border-white/60 px-3 py-1 rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <div className="container mx-auto px-4 flex gap-6 overflow-x-auto text-sm sm:text-base">
          {(['dashboard', 'templates', 'history'] as View[]).map(view => {
            const labels: Record<View, string> = {
              dashboard: 'Dashboard',
              templates: 'Plantillas de Comidas',
              history: 'Historial',
            };
            return (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`pb-3 px-2 font-medium transition-colors border-b-4 whitespace-nowrap ${
                  currentView === view
                    ? 'border-accent text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {labels[view]}
              </button>
            );
          })}
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
                        onChange={e => setNewGoal(e.target.value)}
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
                    <div>
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
            <TemplateManager
              templates={templates}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onAddFromTemplate={addMultipleFoodItems}
            />
          </div>
        )}

        {currentView === 'history' && (
          <div className="max-w-4xl mx-auto">
            <HistoryView history={history} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
