import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const AlertCard = ({ alert }) => {
  const severity = alert.type || alert.severity;
  const message = alert.message || alert.description;
  const timestamp = alert.timestamp || alert.created_at;
  const server = alert.server || alert.server_name || alert.server_id;
  const iconMap = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
  };

  const Icon = iconMap[severity] || Info;

  const colorClass = {
    critical: 'border-l-red-500 bg-red-500/10',
    warning: 'border-l-yellow-500 bg-yellow-500/10',
    info: 'border-l-blue-500 bg-blue-500/10',
    success: 'border-l-emerald-500 bg-emerald-500/10',
  };

  return (
    <div className={`card border-l-4 p-4 ${colorClass[severity] || colorClass.info}`}>
      <div className="flex items-start gap-4">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-white">{alert.title}</h4>
            <span className="text-xs text-gray-500">{timestamp || '—'}</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Server: {server || '—'}</span>
            <StatusBadge status={severity} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
