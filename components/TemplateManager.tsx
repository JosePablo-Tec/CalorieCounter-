import React, { useState } from 'react';
import { FoodTemplate, MealType } from '../types';
import { parseFoodDescription } from '../services/geminiService';
import { LoadingSpinner, PlusIcon, SparklesIcon } from './icons';

interface TemplateManagerProps {
  onAddFromTemplate: (items: { name: string; calories: number }[], meal: MealType) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onAddFromTemplate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<{ name: string; calories: number }[]>([]);
  const [templates, setTemplates] = useState<FoodTemplate[]>([
    // Datos mockup iniciales
    { 
      id: '1', 
      name: 'Desayuno Básico', 
      totalCalories: 270,
      items: [{ name: 'Tostada integral', calories: 80 }, { name: 'Café con leche', calories: 40 }, { name: 'Huevo cocido', calories: 150 }] 
    }
  ]);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Desayuno');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setGeneratedItems([]);
    try {
      const items = await parseFoodDescription(prompt);
      setGeneratedItems(items);
    } catch (error) {
      alert('Error al generar plantilla');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAsTemplate = () => {
    if (generatedItems.length === 0) return;
    const totalCals = generatedItems.reduce((acc, item) => acc + item.calories, 0);
    const newTemplate: FoodTemplate = {
      id: Date.now().toString(),
      name: prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt,
      items: generatedItems,
      totalCalories: totalCals
    };
    setTemplates([...templates, newTemplate]);
    setGeneratedItems([]);
    setPrompt('');
  };

  return (
    <div className="space-y-8">
      {/* Generador con IA */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-2xl shadow-lg text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <SparklesIcon />
          Generador Inteligente de Plantillas
        </h3>
        <p className="mb-4 text-white/90 text-sm">
          Describe tu comida (ej: "Ensalada de pollo con aguacate y un refresco") y la IA calculará las calorías por ti.
        </p>
        
        <div className="flex gap-2 mb-4">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe tu comida completa..."
                className="flex-1 px-4 py-2 rounded-lg text-dark focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-accent text-dark font-bold px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
                {isLoading ? <LoadingSpinner /> : 'Generar'}
            </button>
        </div>

        {generatedItems.length > 0 && (
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <ul className="mb-4 space-y-1">
                    {generatedItems.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="font-mono">{item.calories} kcal</span>
                        </li>
                    ))}
                    <li className="flex justify-between font-bold pt-2 border-t border-white/20 mt-2">
                        <span>Total</span>
                        <span>{generatedItems.reduce((a,b) => a + b.calories, 0)} kcal</span>
                    </li>
                </ul>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => setGeneratedItems([])} className="text-sm underline hover:text-accent">Cancelar</button>
                    <button onClick={saveAsTemplate} className="bg-white text-primary px-3 py-1 rounded-md text-sm font-bold hover:bg-gray-100">
                        Guardar Plantilla
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Lista de Plantillas */}
      <div>
        <h3 className="text-xl font-bold text-dark mb-4">Mis Plantillas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
                <div key={template.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-primary">{template.name}</h4>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                            {template.totalCalories} kcal
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {template.items.map(i => i.name).join(', ')}
                    </p>
                    
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <select 
                            className="bg-gray-50 text-sm border border-gray-200 rounded px-2 py-1 outline-none"
                            value={selectedMeal}
                            onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                        >
                            <option value="Desayuno">Desayuno</option>
                            <option value="Almuerzo">Almuerzo</option>
                            <option value="Cena">Cena</option>
                            <option value="Otros">Otros</option>
                        </select>
                        <button 
                            onClick={() => onAddFromTemplate(template.items, selectedMeal)}
                            className="flex-1 bg-dark text-white text-sm py-1.5 rounded hover:bg-opacity-90 flex items-center justify-center gap-1"
                        >
                            <PlusIcon /> Añadir
                        </button>
                    </div>
                </div>
            ))}
        </div>
        {templates.length === 0 && <p className="text-gray-500 text-center">No hay plantillas guardadas.</p>}
      </div>
    </div>
  );
};

export default TemplateManager;
