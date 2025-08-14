
import React, { useState, useEffect } from 'react';
import { SparklesIcon, LoadingSpinner, ChevronUpIcon, ChevronDownIcon } from './icons';

interface GeminiAdvisorProps {
    onGetAdvice: () => void;
    advice: string;
    isLoading: boolean;
    error: string;
}

const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ onGetAdvice, advice, isLoading, error }) => {
  const [isAdviceVisible, setIsAdviceVisible] = useState(true);

  useEffect(() => {
    // Expande automáticamente para mostrar nuevos consejos cuando llegan
    if (advice && !isLoading) {
      setIsAdviceVisible(true);
    }
  }, [advice, isLoading]);


  const ParsedAdvice = ({ text }: { text: string }) => {
    return (
        <div className="text-sm text-gray-200 space-y-3 selection:bg-primary">
            {text.split('\n').map((line, index) => {
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-md font-bold text-white mt-2">{line.replace('### ', '')}</h3>
                }
                if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="flex items-start">
                        <span className="mr-2 mt-1 text-secondary">●</span>
                        <span className="flex-1">{line.substring(2)}</span>
                      </div>
                    );
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-dark flex items-center gap-2">
          <SparklesIcon />
          Consejos de IA
        </h2>
        {advice && !isLoading && (
          <button
            onClick={() => setIsAdviceVisible(!isAdviceVisible)}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-dark transition-colors"
            aria-label={isAdviceVisible ? "Minimizar consejos" : "Mostrar consejos"}
          >
            {isAdviceVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        )}
      </div>
      
      {!advice && !isLoading && !error && (
        <p className="text-sm text-gray-500 mb-4">
          Obtén consejos personalizados basados en tu consumo y metas para optimizar tu pérdida de peso.
        </p>
      )}

      <button
        onClick={onGetAdvice}
        disabled={isLoading}
        className="w-full bg-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center disabled:bg-gray-400"
      >
        {isLoading ? <LoadingSpinner /> : 'Optimizar mi dieta'}
      </button>

      <div className="mt-4">
        {isLoading && (
          <p className="text-center text-gray-600 animate-pulse">Analizando tu dieta...</p>
        )}
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        {advice && isAdviceVisible && (
          <div className="mt-4 p-4 bg-dark rounded-lg shadow-inner">
            <ParsedAdvice text={advice} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiAdvisor;