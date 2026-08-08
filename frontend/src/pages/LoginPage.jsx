import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function LoginPage() {
  const { currentUser, saveSession, showToast } = useAppContext();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If they are already logged in, bounce them to the dashboard
  useEffect(() => {
    if (currentUser) navigate('/trips');
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
        navigate('/trips');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 fade-enter-active">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
            💸
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Welcome Back</h2>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
          />
          <button 
            type="submit" 
            disabled={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full py-3 rounded-xl transition shadow-lg shadow-blue-200 disabled:opacity-75"
          >
            {isLoading ? 'Loading...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}