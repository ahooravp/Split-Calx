import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function RegisterPage() {
  const { currentUser, saveSession, showToast } = useAppContext();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) navigate('/trips');
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
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
          <div className="w-12 h-12 bg-gray-800 text-white rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
            ✨
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition" 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition" 
          />
          <input 
            type="password" 
            placeholder="Create a Password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition" 
          />
          <button 
            type="submit" 
            disabled={isLoading} 
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold w-full py-3 rounded-xl transition shadow-lg shadow-gray-300 disabled:opacity-75"
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-800 font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}