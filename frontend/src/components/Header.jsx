import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function Header() {
  const { currentUser, clearSession } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Left: App Logo */}
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-sm">
            {/* Temporary Logo SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-700 transition-colors">
            Debt<span className="text-indigo-600">Simplifier</span>
          </span>
        </Link>

        {/* Right: Controls & Auth */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* Night Mode Switch (Placeholder) */}
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer -mr-3"
            title="Toggle Dark Mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Dynamic Auth Buttons */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
                Log In
              </Link>
              <Link to="/register" className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-[0_4px_14px_rgb(79,70,229,0.3)] transition-transform hover:-translate-y-0.5 cursor-pointer">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}