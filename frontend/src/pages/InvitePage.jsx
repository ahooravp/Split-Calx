// src/pages/InvitePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function InvitePage() {
  const { token: shareToken } = useParams();
  const navigate = useNavigate();
  const { currentUser, saveSession, showToast } = useAppContext();
  
  const [view, setView] = useState('list'); // list, claim, register, login
  const [tripInfo, setTripInfo] = useState(null);
  
  // Claim state
  const [claimUser, setClaimUser] = useState({ id: '', name: '' });
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');

  useEffect(() => {
    // If logged in, process automatic join
    if (currentUser) {
      fetch('/api/trips/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: shareToken, userId: currentUser.id })
      }).then(res => res.json()).then(trip => {
        if (trip.id) {
          showToast(`Successfully joined ${trip.name}!`);
          navigate(`/trips/${trip.id}`);
        }
      });
    } else {
      // Fetch invite details
      fetch(`/api/trips/invite/${shareToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.trip) setTripInfo(data);
          else { showToast('Invalid link', true); navigate('/'); }
        }).catch(() => navigate('/'));
    }
  }, [shareToken, currentUser, navigate, showToast]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: claimUser.id, name: claimUser.name, email: claimEmail, password: claimPassword })
      });
      const data = await res.json();
      if (res.ok) saveSession(data.token, data.user); // Will trigger useEffect redirect
      else showToast(data.error, true);
    } catch (err) { showToast('Server error', true);
      console.error('Claim user error:', err);
     }
  };

  if (!tripInfo) return null;

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
            <div className="space-y-3 mb-4">
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
                <input type="email" placeholder="Set your email" required value={claimEmail} onChange={e => setClaimEmail(e.target.value)} className="bg-white border border-gray-200 p-3 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Password</label>
                <input type="password" placeholder="Set a password" required value={claimPassword} onChange={e => setClaimPassword(e.target.value)} className="bg-white border border-gray-200 p-3 w-full mb-6 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full py-3.5 rounded-xl transition shadow-xl shadow-indigo-200 text-lg">Claim & Join Trip</button>
              </form>
            </div>
          </div>
        )}

        {/* View switching for 'register' and 'login' would mirror the Auth component with slight restyling, triggering standard auth fetches then redirecting. */}
      </div>
    </div>
  );
}