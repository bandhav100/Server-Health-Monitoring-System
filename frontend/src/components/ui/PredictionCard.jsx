import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PredictionCard = ({ prediction }) => {
  const trendIcons = {
    increasing: TrendingUp,
    decreasing: TrendingDown,
    stable: Minus,
  };

  const TrendIcon = trendIcons[prediction.status] || Minus;
  const trendColor = {
    increasing: 'text-red-400',
    decreasing: 'text-emerald-400',
    stable: 'text-yellow-400',
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-white text-sm">{prediction.title}</h4>
        {prediction.status && <TrendIcon className={`w-4 h-4 ${trendColor[prediction.status]}`} />}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400">Current</p>
          <p className="text-lg font-bold text-white">{prediction.current ?? 'Unavailable'}{prediction.current != null && '%'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Predicted</p>
          <p className="text-lg font-bold text-blue-400">{prediction.predicted ?? 'Unavailable'}{prediction.predicted != null && '%'}</p>
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        {prediction.current != null && <div
          className="bg-emerald-500 h-2 rounded-full"
          style={{ width: `${prediction.current}%` }}
        />}
      </div>
      <p className="text-xs text-gray-500 mt-2">{prediction.timeframe}</p>
    </div>
  );
};

export default PredictionCard;
