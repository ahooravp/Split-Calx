// src/pages/AuthPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function AuthPage() {
  const { currentUser, saveSession, showToast } = useAppContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/trips');
  }, [currentUser, navigate]);

  const handleAuth = async (e, endpoint, payload) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl mt-10 border border-gray-100 fade-enter-active">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
          💸
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800">Debt Simplifier</h2>
        <p className="text-gray-500 text-sm mt-1">Split expenses without the headache.</p>
      </div>

      <form onSubmit={(e) => handleAuth(e, '/auth/login', { email: loginEmail, password: loginPassword })} className="mb-6">
        <input type="email" placeholder="Email Address" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
          className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" />
        <input type="password" placeholder="Password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
          className="bg-gray-50 border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" />
        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full py-3 rounded-xl transition shadow-lg shadow-blue-200 disabled:opacity-75">
          {isLoading ? 'Loading...' : 'Log In'}
        </button>
      </form>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider font-bold">Or</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <form onSubmit={(e) => handleAuth(e, '/auth/register', { name: regName, email: regEmail, password: regPassword })}>
        <input type="text" placeholder="Full Name" required value={regName} onChange={(e) => setRegName(e.target.value)}
          className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition" />
        <input type="email" placeholder="Email Address" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
          className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition" />
        <input type="password" placeholder="Create a Password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
          className="bg-gray-50 border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-gray-800 transition" />
        <button type="submit" disabled={isLoading} className="bg-gray-800 hover:bg-gray-900 text-white font-bold w-full py-3 rounded-xl transition shadow-lg shadow-gray-300 disabled:opacity-75">
          {isLoading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}