import React from 'react';

const StatusBadge = ({ status }) => {
  const statusStyles = {
    healthy: 'badge badge-success',
    warning: 'badge badge-warning',
    critical: 'badge badge-danger',
    info: 'badge badge-info',
    down: 'badge bg-gray-600 text-gray-200',
    offline: 'badge bg-gray-600 text-gray-200',
  };

  const statusLabels = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    info: 'Info',
    down: 'Offline',
    offline: 'Offline',
  };

  return <span className={statusStyles[status] || statusStyles.info}>{statusLabels[status]}</span>;
};

export default StatusBadge;
