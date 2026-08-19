import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function Header() {
  const { currentUser, clearSession } = useAppContext();
  const navigate = useNavigate();

  // 1. LAZY INITIALIZATION: Check the theme instantly on the first pass, preventing double-renders.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // 2. DOM SYNC: Only applies the class on mount. No state updates allowed here.
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Run once on mount

  // 3. SNAPPY TOGGLE: Updates React state and DOM simultaneously
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode); // Updates the UI icons instantly
    
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    // Changed to transition-colors. transition-all forces the browser to re-calculate the heavy backdrop-blur on every frame.
    <header className="fixed backdrop-blur-xs top-0 w-full z-50 bg-slate-50/50 dark:bg-slate-950/90 border-b border-white/60 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-1.5 group cursor-pointer">
          <img src="../public/split-calx-logo.png" alt="" width={32} height={32} className='hover:scale-110 duration-300' />
          <span className="font-extrabold text-2xl tracking-tight text-emerald-500 group-hover:translate-x-1 transition-all duration-300">
            Split<span className="text-indigo-600 dark:text-indigo-400 ml-1 transition-colors duration-300">Calx</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Animated Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-slate-800/60 transition-all duration-300 cursor-pointer overflow-hidden -mr-3"
            title="Toggle Theme"
          >
            {/* Sun Icon (Light Mode) */}
            <div 
              className={`absolute transition-all duration-300 ease-in ${
                isDarkMode ? 'translate-y-8 opacity-0 rotate-45' : 'translate-y-0 opacity-100 rotate-0'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708" />
              </svg>
            </div>

            {/* Moon Icon (Dark Mode) */}
            <div 
              className={`absolute transition-all duration-300 ease-in ${
                isDarkMode ? 'translate-y-0 opacity-100 rotate-0' : '-translate-y-8 opacity-0 -rotate-45'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block transition-colors duration-300"></div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 px-4 py-2 rounded-xl transition-all duration-300 shadow-xs cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                Log In
              </Link>
              <Link to="/register" className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-4 py-2 rounded-xl shadow-sm transition-all duration-300 ease-in hover:-translate-y-0.5 cursor-pointer">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}