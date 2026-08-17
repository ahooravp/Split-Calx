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
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-gray-500 font-bold animate-pulse text-lg">
                  {currentUser ? "Joining group..." : "Loading invite..."}
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl mt-10 border border-gray-100 relative overflow-hidden fade-enter-active">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 flex items-center justify-center relative">
        <div className="absolute -bottom-8 w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center rotate-3">
          <span className="text-3xl -rotate-3">👋</span>
        </div>
      </div>
      
      <div className="p-6 sm:p-8 pt-12">
        <div className="text-center mb-8">
          <p className="text-gray-600 mt-1 leading-relaxed">
            <strong className="text-gray-900 font-bold">{tripInfo.inviter}</strong> has invited you to the group <br />
            <strong className="text-indigo-600 text-lg">"{tripInfo.trip.name}"</strong>
          </p>
        </div>

        {view === 'list' && (
          <div className="block fade-enter-active">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Select your name:</h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {tripInfo.members.map(member => (
                member.email ? (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-transparent opacity-60 bg-gray-50 rounded-xl cursor-not-allowed">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">{member.name.charAt(0)}</div>
                      <div>
                        <span className="block line-through text-gray-500 font-medium">{member.name}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">Already joined</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={member.id} onClick={() => { setClaimUser(member); setView('claim'); }} className="flex items-center justify-between p-4 border border-gray-200 hover:border-indigo-400 hover:shadow-md bg-white rounded-xl cursor-pointer transition duration-200 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition duration-200">{member.name.charAt(0)}</div>
                      <span className="block text-gray-800 font-bold text-base group-hover:text-indigo-700 transition">{member.name}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
            <button onClick={() => setView('register')} className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition shadow-sm">
               <span>Join as a new member</span>
            </button>
            <div className="mt-6 text-center">
              <button onClick={() => setView('login')} className="text-sm text-indigo-600 font-bold hover:underline transition">
                Already have an account? Log In
              </button>
            </div>
          </div>
        )}

        {view === 'claim' && (
          <div className="fade-enter-active">
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center font-medium">&larr; Back to list</button>
            <div className="bg-gray-50 p-5 border border-gray-200 rounded-2xl">
              <form onSubmit={handleClaimSubmit}>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Confirm Your Name</label>
                <input type="text" value={claimUser.name} readOnly className="bg-white border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none text-gray-900 font-bold" />
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Email Address</label>
                <input type="email" placeholder="Set your email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-white border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Password</label>
                <input type="password" placeholder="Set a password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-white border border-gray-200 p-3 w-full mb-6 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white font-bold w-full py-3.5 rounded-xl transition shadow-xl shadow-indigo-200 text-lg">
                    {isProcessing ? 'Claiming...' : 'Claim & Join Trip'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FIX: Injected the missing Register View */}
        {view === 'register' && (
          <div className="fade-enter-active">
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center font-medium">&larr; Back to list</button>
            <form onSubmit={(e) => handleAuth(e, '/auth/register')}>
                <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                <input type="password" placeholder="Create a Password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                <button type="submit" disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white font-bold w-full py-3.5 rounded-xl transition shadow-xl shadow-indigo-200 text-lg">
                    {isProcessing ? 'Creating...' : 'Create Account & Join'}
                </button>
            </form>
          </div>
        )}

        {/* FIX: Injected the missing Login View */}
        {view === 'login' && (
          <div className="fade-enter-active">
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center font-medium">&larr; Back to list</button>
            <form onSubmit={(e) => handleAuth(e, '/auth/login')}>
                <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold w-full py-3.5 rounded-xl transition shadow-xl shadow-blue-200 text-lg">
                    {isProcessing ? 'Logging in...' : 'Log In & Join'}
                </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}