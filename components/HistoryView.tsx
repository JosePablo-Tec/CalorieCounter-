import React from 'react';
import { DailyHistory } from '../types';

// Datos Mock para el historial
const MOCK_HISTORY: DailyHistory[] = [
    {
        date: '2023-10-25',
        totalCalories: 2150,
        goal: 2000,
        items: []
    },
    {
        date: '2023-10-24',
        totalCalories: 1850,
        goal: 2000,
        items: []
    },
    {
        date: '2023-10-23',
        totalCalories: 1980,
        goal: 2000,
        items: []
    },
];

const HistoryView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark mb-6">Historial de Consumo</h2>
      
      <div className="overflow-hidden rounded-xl shadow-lg border border-gray-100 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {MOCK_HISTORY.map((day) => {
              const percentage = (day.totalCalories / day.goal) * 100;
              const isOver = day.totalCalories > day.goal;
              
              return (
                <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {day.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.goal} kcal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.totalCalories} kcal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isOver ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isOver ? `+${day.totalCalories - day.goal}` : 'Objetivo Cumplido'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <p className="text-center text-sm text-gray-400 mt-4">
        * Datos cargados desde almacenamiento local (SQL placeholder)
      </p>
    </div>
  );
};

export default HistoryView;
