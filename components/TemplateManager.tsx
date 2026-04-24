import React, { useState } from 'react';
import { FoodTemplate, MealType } from '../types';
import { PlusIcon, DeleteIcon, CloseIcon } from './icons';
import { uuid } from '../utils/uuid';

interface TemplateManagerProps {
  templates: FoodTemplate[];
  onSaveTemplate: (template: FoodTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onAddFromTemplate: (items: { name: string; calories: number }[], meal: MealType) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onAddFromTemplate,
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Desayuno');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [draftItems, setDraftItems] = useState<{ name: string; calories: number }[]>([]);
  const [tempItemName, setTempItemName] = useState('');
  const [tempItemCalories, setTempItemCalories] = useState('');

  const handleAddItemToDraft = () => {
    const cals = parseInt(tempItemCalories, 10);
    if (tempItemName.trim() && !isNaN(cals) && cals > 0) {
      setDraftItems(prev => [...prev, { name: tempItemName.trim(), calories: cals }]);
      setTempItemName('');
      setTempItemCalories('');
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || draftItems.length === 0) return;
    onSaveTemplate({
      id: uuid(),
      name: newTemplateName.trim(),
      items: draftItems,
      totalCalories: draftItems.reduce((acc, item) => acc + item.calories, 0),
    });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTemplateName('');
    setDraftItems([]);
    setTempItemName('');
    setTempItemCalories('');
  };

  const currentDraftTotal = draftItems.reduce((acc, item) => acc + item.calories, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-dark">Mis Plantillas</h3>
          <p className="text-sm text-gray-500">Crea grupos de alimentos para añadirlos rápidamente.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-sm"
        >
          <PlusIcon />
          Crear Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-primary">{template.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    {template.totalCalories} kcal
                  </span>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                    aria-label={`Eliminar plantilla ${template.name}`}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
              <ul className="text-sm text-gray-500 mb-4 space-y-1">
                {template.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between border-b border-gray-50 pb-1 last:border-0">
                    <span>{item.name}</span>
                    <span className="text-gray-400 text-xs">{item.calories} kcal</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
              <select
                className="bg-gray-50 text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                value={selectedMeal}
                onChange={e => setSelectedMeal(e.target.value as MealType)}
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Cena">Cena</option>
                <option value="Otros">Otros</option>
              </select>
              <button
                onClick={() => onAddFromTemplate(template.items, selectedMeal)}
                className="flex-1 bg-dark text-white text-sm py-1.5 rounded hover:bg-opacity-90 flex items-center justify-center gap-1 font-medium"
              >
                <PlusIcon /> Añadir al Registro
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No tienes plantillas guardadas.</p>
          <button onClick={() => setIsModalOpen(true)} className="text-primary font-bold hover:underline mt-2">
            Crear una ahora
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-primary flex justify-between items-center">
              <h3 className="text-white text-lg font-bold">Nueva Plantilla</h3>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Plantilla</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Ej: Almuerzo ligero"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Agregar Alimentos</h4>
                <div className="flex gap-2 mb-2 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={tempItemName}
                    onChange={e => setTempItemName(e.target.value)}
                    placeholder="Alimento (Ej: Manzana)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={tempItemCalories}
                      onChange={e => setTempItemCalories(e.target.value)}
                      placeholder="Kcal"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={e => e.key === 'Enter' && handleAddItemToDraft()}
                    />
                    <button
                      onClick={handleAddItemToDraft}
                      className="bg-secondary text-white px-3 py-2 rounded-lg hover:bg-opacity-90"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-500">Alimentos en esta plantilla:</h4>
                  <span className="text-sm font-bold text-primary">Total: {currentDraftTotal} kcal</span>
                </div>
                {draftItems.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">Añade alimentos para construir tu plantilla.</p>
                ) : (
                  <ul className="space-y-2">
                    {draftItems.map((item, index) => (
                      <li key={index} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded shadow-sm">
                        <span className="text-sm text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-600">{item.calories} kcal</span>
                          <button
                            onClick={() => setDraftItems(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-400 hover:text-red-600"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-dark font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim() || draftItems.length === 0}
                className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
