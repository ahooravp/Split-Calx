import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import ThemeToggle from './ThemeToggle'; // Make sure the path matches where you saved the toggle!

export default function Header() {
  const { currentUser, clearSession } = useAppContext();
  const navigate = useNavigate();

  // 1. LAZY INITIALIZATION: Kept intact to prevent double-renders on load
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // 2. DOM SYNC: Applies initial class on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Run once on mount

  // 3. NEW THEME HANDLER: Upgraded to accept the exact string from the Slider component
  const handleThemeChange = (newTheme) => {
    const wantsDark = newTheme === 'dark';
    
    // Safety check to prevent unnecessary DOM re-paints
    if (wantsDark === isDarkMode) return; 

    setIsDarkMode(wantsDark); 
    
    if (wantsDark) {
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
    <header className="fixed backdrop-blur-xs top-0 w-full z-50 bg-slate-50/50 dark:bg-slate-950/90 border-b border-white/60 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-1.5 group cursor-pointer">
          <img src="/split-calx-logo.png" alt="" width={30} height={30} className='hover:scale-110 duration-300' />
          <span className="font-extrabold text-2xl tracking-tight text-emerald-500 group-hover:translate-x-1 transition-all duration-300">
            Split<span className="text-indigo-600 dark:text-indigo-400 ml-1 transition-colors duration-300">Calx</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* === SLIDER TOGGLE INJECTED HERE === */}
          <ThemeToggle 
            theme={isDarkMode ? "dark" : "light"} 
            setTheme={handleThemeChange} 
          />

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