import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ icon: Icon, label, value, unit = '', trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  const trendColors = {
    up: 'text-red-400',
    down: 'text-emerald-400',
    stable: 'text-yellow-400',
  };

  return (
    <motion.div
      className="card p-6"
      whileHover={{ translateY: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">
              {value}
              <span className="text-lg ml-1">{unit}</span>
            </h3>
          </div>
          {trend && (
            <p className={`text-xs mt-2 ${trendColors[trend.direction]}`}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
              {trend.percent}% {trend.label}
            </p>
          )}
        </div>
        {Icon && <Icon className={`w-8 h-8 ${colorClasses[color]} opacity-60`} />}
      </div>
    </motion.div>
  );
};

export default MetricCard;
