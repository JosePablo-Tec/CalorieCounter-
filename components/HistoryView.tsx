import React from 'react';
import { DailyHistory } from '../types';

interface HistoryViewProps {
  history: DailyHistory[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ history }) => {
  const records = [...history]
    .filter(d => d.totalCalories > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleExportCSV = () => {
    const header = 'Fecha,Meta (kcal),Consumo (kcal),Diferencia (kcal)\n';
    const rows = records.map(day => {
      const diff = day.totalCalories - day.goal;
      return `${day.date},${day.goal},${day.totalCalories},${diff > 0 ? '+' : ''}${diff}`;
    }).join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historial_calorias.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-dark mb-6">Historial de Consumo</h2>
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">Aún no hay registros en el historial.</p>
          <p className="text-gray-400 text-sm mt-1">Los días con alimentos registrados aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Historial de Consumo</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Exportar CSV
        </button>
      </div>
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
            {records.map(day => {
              const isOver = day.totalCalories > day.goal;
              const diff = Math.abs(day.totalCalories - day.goal);
              return (
                <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{day.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.goal.toLocaleString()} kcal</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalCalories.toLocaleString()} kcal</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isOver ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {isOver ? `+${diff.toLocaleString()} kcal` : 'Objetivo Cumplido'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryView;
