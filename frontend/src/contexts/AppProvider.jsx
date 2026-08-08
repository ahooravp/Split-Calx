import { useState, useCallback, useMemo } from 'react';
import { AppContext } from './AppContext'; 

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('debt_token') || null);
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('debt_user')) || null
  );
  
  const [toast, setToast] = useState({ visible: false, message: '', isError: false });

  // 1. Stabilize functions with useCallback
  const saveSession = useCallback((newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem('debt_token', newToken);
    localStorage.setItem('debt_user', JSON.stringify(user));
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('debt_token');
    localStorage.removeItem('debt_user');
  }, []);

  const showToast = useCallback((message, isError = false) => {
    setToast({ visible: true, message, isError });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // 2. Stabilize the final context object with useMemo
  const contextValue = useMemo(() => ({
    token, 
    currentUser, 
    saveSession, 
    clearSession, 
    showToast, 
    toast
  }), [token, currentUser, saveSession, clearSession, showToast, toast]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
      
      <div
        className={`fixed top-5 left-1/2 transform -translate-x-1/2 px-5 py-3.5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] text-gray-800 font-bold text-sm z-50 flex items-center gap-3 bg-white border border-gray-100 transition-all duration-500 ease-out ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
        }`}
      >
        {toast.isError ? (
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>{toast.message}</span>
      </div>
    </AppContext.Provider>
  );
};