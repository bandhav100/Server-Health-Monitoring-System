import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

const ActivityTimeline = ({ activities }) => {
  const getIcon = (iconName) => {
    const Icon = LucideIcons[iconName];
    return Icon ? Icon : LucideIcons.Activity;
  };

  const colorMap = {
    red: 'text-red-400 bg-red-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/20',
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        const Icon = getIcon(activity.icon);
        const colorClass = colorMap[activity.color] || colorMap.blue;

        return (
          <motion.div
            key={activity.id}
            className="flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-white">{activity.event}</p>
              <p className="text-xs text-gray-400 mt-0.5">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
