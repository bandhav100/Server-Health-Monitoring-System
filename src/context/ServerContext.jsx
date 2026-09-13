import React, { createContext, useContext, useState } from 'react';

const ServerContext = createContext(null);

export const SERVER_OPTIONS = [
  { key: 'bandhav', name: 'Bandhav', ip: '100.84.0.9', instance: '100.84.0.9:9182' },
  { key: 'lenovo', name: 'LENOVO', ip: '100.95.242.5', instance: '100.95.242.5:9182' },
  { key: 'navadeep', name: 'Navadeep', ip: '100.72.224.107', instance: '100.72.224.107:9182' },
  { key: 'manju', name: 'Manju', ip: '100.104.89.32', instance: '100.104.89.32:9182' },
  { key: 'saivinay', name: 'Saivinay', ip: '100.102.76.81', instance: '100.102.76.81:9182' },
];

export const ServerProvider = ({ children }) => {
  const [selectedServerKey, setSelectedServerKey] = useState('bandhav');
  const selectedOption = selectedServerKey === 'ALL'
    ? { key: 'ALL', name: 'All Servers', instance: 'ALL' }
    : SERVER_OPTIONS.find((option) => option.key === selectedServerKey) || SERVER_OPTIONS[0];

  return (
    <ServerContext.Provider
      value={{
        selectedServer: selectedOption,
        selectedInstance: selectedOption.instance,
        selectedServerKey,
        selectedServerOption: selectedOption,
        setSelectedServer: setSelectedServerKey,
        serverOptions: SERVER_OPTIONS,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServerContext = () => {
  const context = useContext(ServerContext);
  if (!context) throw new Error('useServerContext must be used within ServerProvider');
  return context;
};

