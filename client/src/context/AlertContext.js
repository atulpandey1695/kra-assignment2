import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, addAlert, clearAlerts, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
