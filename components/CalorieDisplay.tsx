
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CalorieDisplayProps {
  total: number;
  goal: number;
}

const CalorieDisplay: React.FC<CalorieDisplayProps> = ({ total, goal }) => {
  const percentage = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - total, 0);

  const data = [
    {
      name: 'Calories',
      uv: percentage,
      fill: '#02C39A',
    },
  ];

  return (
    <div className="w-full h-56 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          barSize={20}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="uv"
            cornerRadius={10}
            className="fill-primary"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-dark">{total.toLocaleString()}</span>
        <span className="text-sm text-gray-500">Consumidas</span>
      </div>
      <p className="text-center mt-[-20px] text-lg">
        <span className="font-bold text-primary">{remaining.toLocaleString()}</span>
        <span className="text-sm text-gray-600"> restantes</span>
      </p>
    </div>
  );
};

export default CalorieDisplay;
