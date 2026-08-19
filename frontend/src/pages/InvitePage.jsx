// src/pages/InvitePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function InvitePage() {
  const { token: shareToken } = useParams();
  const navigate = useNavigate();
  const { currentUser, saveSession, showToast, token } = useAppContext();

  const [view, setView] = useState('list'); // list, claim, register, login
  const [tripInfo, setTripInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Claim state
  const [claimUser, setClaimUser] = useState({ id: '', name: '' });

  // Auth state for new forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    // 1. THE SAFEGUARD: Track if the component is still alive
    let isMounted = true;

    if (currentUser) {
      // Notice we REMOVED setIsProcessing(true) here to prevent the cascading re-render!

      fetch('/api/trips/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: shareToken })
      })
        .then(res => res.json())
        .then(trip => {
          // 2. THE CHECK: Stop execution if the component unmounted while we were waiting
          if (!isMounted) return;

          if (trip.id) {
            showToast(`Successfully joined ${trip.name}!`);
            navigate(`/trips/${trip.id}`);
          } else {
            showToast(trip.error || 'Failed to join trip', true);
            navigate('/');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          showToast('Server error', true);
          navigate('/');
        });
    } else {
      // Fetch invite details for unauthenticated users
      fetch(`/auth/invite/${shareToken}`)
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;

          if (data.trip) {
            setTripInfo(data);
          } else {
            showToast('Invalid link', true);
            navigate('/');
          }
        }).catch(() => {
          if (!isMounted) return;
          showToast('Failed to load invite', true);
          navigate('/');
        });
    }

    // 3. THE CLEANUP: React runs this exactly once when the component unmounts
    return () => {
      isMounted = false;
    };
  }, [shareToken, currentUser, navigate, showToast, token]); // 

  // Handle standard login/register directly from the invite page
  const handleAuth = async (e, endpoint) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const payload = endpoint === '/auth/login'
        ? { email, password }
        : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        // Saving the session updates currentUser, which triggers the useEffect above to auto-join!
        saveSession(data.token, data.user);
      } else {
        showToast(data.error || data.message, true);
        setIsProcessing(false);
      }
    } catch (err) {
      showToast('Server error', true);
      console.error('Auth error:', err);
      setIsProcessing(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: claimUser.id, name: claimUser.name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        saveSession(data.token, data.user);
      } else {
        showToast(data.error, true);
        setIsProcessing(false);
      }
    } catch (err) {
      showToast('Server error', true);
      setIsProcessing(false);
      console.error('Claim error:', err)
    }

  };

  // FIX: Render a loading state instead of a completely blank screen
  if (currentUser || !tripInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-[background-color] duration-300 ease-in-out">
        <div className="text-gray-500 dark:text-slate-500 font-bold animate-pulse text-lg transition-colors duration-300 ease-in-out">
          {currentUser ? "Joining group..." : "Loading invite..."}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 pt-16 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">

      {/* Bulletproof Fixed Viewport Canvas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-indigo-200 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-40 transition-all duration-300 ease-in-out"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-teal-200 dark:bg-teal-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 transition-all duration-300 ease-in-out"></div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 relative z-10 overflow-hidden fade-enter-active transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 flex items-center justify-center relative">
          <div className="absolute -bottom-8 w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-md flex items-center justify-center rotate-3 transition-[background-color,box-shadow] duration-300 ease-in-out">
            <span className="text-3xl -rotate-3">👋</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-12">
          <div className="text-center mb-8">

            <p className="text-gray-600 dark:text-slate-400 mt-1 leading-relaxed transition-colors duration-300 ease-in-out">

              <strong className="text-gray-900 dark:text-white font-bold">{tripInfo.inviter}</strong> has invited you to the group <br />
              <strong className="text-indigo-600 dark:text-indigo-400 text-lg">"{tripInfo.trip.name}"</strong>
            </p>
          </div>

          {view === 'list' && (
            <div className="block fade-enter-active">
              <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-sm transition-colors duration-300 ease-in-out">Select your name:</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {tripInfo.members.map(member => (
                member.email ? (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-transparent opacity-60 bg-gray-50 dark:bg-slate-800/50 rounded-xl cursor-not-allowed transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-400 font-bold text-lg transition-colors duration-300 ease-in-out">{member.name.charAt(0)}</div>
                      <div>
                        <span className="block line-through text-gray-500 dark:text-slate-400 font-medium transition-colors duration-300 ease-in-out">{member.name}</span>
                        <span className="block text-xs text-gray-400 dark:text-slate-500 mt-0.5 transition-colors duration-300 ease-in-out">Already joined</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  
                  <div key={member.id} onClick={() => { setClaimUser(member); setView('claim'); }} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md bg-white dark:bg-slate-800/50 rounded-xl cursor-pointer group transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 ease-in-out">{member.name.charAt(0)}</div>
                      <span className="block text-gray-800 dark:text-slate-200 font-bold text-base group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors duration-300 ease-in-out">{member.name}</span>
                    </div>
                  </div>
                )
              ))}
              </div>
              <button onClick={() => setView('register')} className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium rounded-xl shadow-sm transition-all duration-300 ease-in-out">
                <span>Join as a new member</span>
              </button>
              <div className="mt-6 text-center">
                <button onClick={() => setView('login')} className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors duration-300 ease-in-out">
                  Already have an account? Log In
                </button>
              </div>
            </div>
          )}

          {view === 'claim' && (
            <div className="fade-enter-active">
              <button onClick={() => setView('list')} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 mb-4 flex items-center font-medium transition-colors duration-300 ease-in-out">&larr; Back to list</button>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 border border-gray-200 dark:border-slate-700 rounded-2xl transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                <form onSubmit={handleClaimSubmit}>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wider transition-colors duration-300 ease-in-out">Confirm Your Name</label>
                  <input type="text" value={claimUser.name} readOnly className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 w-full mb-4 rounded-xl outline-none text-gray-900 dark:text-white font-bold transition-all duration-300 ease-in-out" />
                  
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wider transition-colors duration-300 ease-in-out">Email Address</label>
                  <input type="email" placeholder="Set your email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all duration-300 ease-in-out" />
                  
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wider transition-colors duration-300 ease-in-out">Password</label>
                  <input type="password" placeholder="Set a password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 w-full mb-6 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all duration-300 ease-in-out" />
                  
                  <button type="submit" disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-75 text-white font-bold w-full py-3.5 rounded-xl shadow-xl  dark:shadow-[0_8px_30px_rgba(79,70,229,0.3)] text-lg transition-all duration-300 ease-in-out">
                    {isProcessing ? 'Claiming...' : 'Claim & Join Trip'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="fade-enter-active">
              <button onClick={() => setView('list')} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 mb-4 flex items-center font-medium transition-colors duration-300 ease-in-out">&larr; Back to list</button>
              <form onSubmit={(e) => handleAuth(e, '/auth/register')}>
                <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out" />
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out" />
                <input type="password" placeholder="Create a Password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out" />
                <button type="submit" disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-75 text-white font-bold w-full py-3.5 rounded-xl shadow-xl  dark:shadow-[0_8px_30px_rgba(79,70,229,0.3)] text-lg transition-all duration-300 ease-in-out">
                  {isProcessing ? 'Creating...' : 'Create Account & Join'}
                </button>
              </form>
            </div>
          )}

          {view === 'login' && (
            <div className="fade-enter-active">
              <button onClick={() => setView('list')} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 mb-4 flex items-center font-medium transition-colors duration-300 ease-in-out">&larr; Back to list</button>
              <form onSubmit={(e) => handleAuth(e, '/auth/login')}>
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 transition-all duration-300 ease-in-out" />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-indigo-500 transition-all duration-300 ease-in-out" />
                <button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-75 text-white font-bold w-full py-3.5 rounded-xl shadow-xl  dark:shadow-[0_8px_30px_rgba(79,70,229,0.3)] text-lg transition-all duration-300 ease-in-out">
                  {isProcessing ? 'Logging in...' : 'Log In & Join'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}