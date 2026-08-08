import { createContext, useContext } from 'react';

export const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  
  // Bulletproof check: Ensure the hook is actually being called inside the provider
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};