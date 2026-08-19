import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function LoginPage() {
  const { currentUser, saveSession, showToast } = useAppContext();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        saveSession(data.token, data.user);
        navigate('/dashboard');
      } else {
        showToast(data.error || data.message, true);
      }
    } catch (err) {
      showToast('Server error', true);
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

return (
    
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 pt-16 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Blobs locked into the 300ms layout engine */}
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-indigo-200 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-40 transition-all duration-300 ease-in-out"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-teal-200 dark:bg-teal-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 transition-all duration-300 ease-in-out"></div>
      </div>

      {/* Locked to transition-[background-color,border-color,box-shadow] to protect backdrop-blur-xl */}
      <div className="max-w-md w-full relative z-10 fade-enter-active bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/60 dark:border-slate-700/50 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
        
        <div className="text-center mb-8">
          {/* Parent div handles bg/border, SVG explicitly handles its own text color */}
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600 dark:text-indigo-400 transition-colors duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors duration-300 ease-in-out">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors duration-300 ease-in-out">Log in to track your expenses.</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider transition-colors duration-300 ease-in-out">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3.5 w-full rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-300 ease-in-out" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider transition-colors duration-300 ease-in-out">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3.5 w-full rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-300 ease-in-out" 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="mt-2 flex justify-center items-center cursor-pointer bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold w-full py-4 rounded-xl shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 ease-in-out"
          >
            {isLoading && (
              <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Separated into distinct spans to prevent double-transition bleed from the parent */}
        <div className="text-center text-sm font-medium">
          <span className="text-slate-500 dark:text-slate-400 transition-colors duration-300 ease-in-out">Don't have an account? </span>
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors duration-300 ease-in-out">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}