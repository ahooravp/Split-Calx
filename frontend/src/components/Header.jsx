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
    <header className="sticky top-0 z-50 bg-slate-50/50 backdrop-blur-lg  border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">

        {/* Left: App Logo */}
        <Link to="/" className="flex items-center gap-1.5 group cursor-pointer">


          <img src="../public/split-calx-logo.png" alt="" width={32} height={32} className='hover:scale-110 duration-300' />

          <span className="font-extrabold text-2xl tracking-tight text-emerald-500 group-hover:translate-x-1 transition-transform duration-300">
            Split<span className="text-indigo-600 ml-1">Calx</span>
          </span>
        </Link>

        {/* Right: Controls & Auth */}
        <div className="flex items-center gap-3 sm:gap-5">

          {/* Night Mode Switch (Placeholder) */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors cursor-pointer -mr-3"
            title="Toggle Light Mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-sun" viewBox="0 0 16 16">
              <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708" />
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
                className="text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">
                Log In
              </Link>
              <Link to="/register" className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}