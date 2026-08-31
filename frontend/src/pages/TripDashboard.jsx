// src/pages/TripDashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function TripDashboard() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { token, currentUser, showToast } = useAppContext();
  const [activeAction, setActiveAction] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [trip, setTrip] = useState({ name: 'Loading...', share_token: '' });
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState(null);

  const [isCopied, setIsCopied] = useState(false);

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedSplits, setSelectedSplits] = useState([]);

  // --- NEW: Delete Expense State & Ref ---
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const expenseDialogRef = useRef(null);

  const fetchTripDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data);
      }
    } catch (err) {
      showToast('Failed to load trip', true);
      console.error(err);
    }
  }, [tripId, token, showToast]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);

        setPayerId((prev) => {
          if (prev) return prev;
          return data.find(m => m.id === currentUser.id)?.id || data[0]?.id || '';
        });

        setSelectedSplits(data.map(m => m.id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [tripId, token, currentUser]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [tripId, token]);

  useEffect(() => {
    const initializeDashboard = async () => {
      setIsInitializing(true);
      await Promise.all([
        fetchTripDetails(),
        fetchMembers(),
        fetchExpenses()
      ]);
      setIsInitializing(false);
    };
    initializeDashboard();
  }, [fetchTripDetails, fetchMembers, fetchExpenses]);

  const handleCopyLink = () => {
    if (!trip.share_token) return showToast('Cannot generate link.', true);
    const link = `${window.location.origin}/invite/${trip.share_token}`;
    navigator.clipboard.writeText(link).then(() => {
      setIsCopied(true);
      showToast('Invite link copied!');
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleAddFriend = async (e) => {
    setActiveAction('ADD_FRIEND');
    e.preventDefault();
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });
      if (res.ok) {
        setInviteName(''); setInviteEmail('');
        fetchMembers();
        showToast(`${inviteName} added!`);
      } else {
        const data = await res.json();
        showToast(data.error, true);
      }
    } catch (err) {
      showToast('Server error', true);
      console.error('Add friend error:', err);
    }
    finally {
      setActiveAction(null);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (selectedSplits.length === 0) return showToast('Select at least one person.', true);

    if (parseFloat(expenseAmount) <= 0) {
      return showToast('Expense amount cannot be zero.', true);
    }

    setActiveAction('ADD_EXPENSE');

    const amount = parseFloat(expenseAmount);
    const totalCents = Math.round(amount * 100);
    const centsPerPerson = Math.floor(totalCents / selectedSplits.length);
    let remainder = totalCents % selectedSplits.length;

    const splits = selectedSplits.map(userId => {
      let amountOwed = centsPerPerson;
      if (remainder > 0) { amountOwed += 1; remainder -= 1; }
      return { user_id: userId, amount: parseFloat((amountOwed / 100).toFixed(2)) };
    });

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trip_id: tripId, payer_id: payerId, description: expenseDesc, total_amount: amount, splits })
      });
      if (res.ok) {
        setExpenseDesc(''); setExpenseAmount('');
        showToast('Expense logged!');
        fetchExpenses();
        if (debts) handleCalculate();
      }
    } catch (err) {
      showToast('Server error', true);
      console.error('Add expense error:', err);
    }
    finally {
      setActiveAction(null);
    }
  };

  const handleCalculate = async () => {
    setActiveAction('CALCULATE_DEBTS');
    try {
      const res = await fetch(`/api/trips/${tripId}/settle`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDebts(await res.json());
    } catch (err) {
      showToast('Server error', true);
      console.error('Calculate debts error:', err);
    }
    finally {
      setActiveAction(null);
    }
  };

  const toggleSplit = (id) => {
    setSelectedSplits(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  };

  // --- NEW: Delete Expense Methods ---
  const confirmDeleteExpense = (expId, e) => {
    e.stopPropagation();
    setExpenseToDelete(expId);
    setTimeout(() => {
      if (expenseDialogRef.current) expenseDialogRef.current.showModal();
    }, 0);
  };

  const cancelDeleteExpense = () => {
    if (expenseDialogRef.current) expenseDialogRef.current.close();
    setExpenseToDelete(null);
  };

  const executeDeleteExpense = async () => {
    if (!expenseToDelete) return;
    const idToKill = expenseToDelete;

    cancelDeleteExpense();

    try {
      const res = await fetch(`/api/expenses/${idToKill}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Expense deleted successfully!');
        fetchExpenses();
        // Instantly recalculate the math if the ledger is open
        if (debts) handleCalculate();
      } else {
        showToast(data.error, true);
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      showToast('Server error while deleting', true);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out pt-16">

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-indigo-200 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 transition-all duration-300 ease-in-out"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-teal-200 dark:bg-teal-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 transition-all duration-300 ease-in-out"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-emerald-200 dark:bg-emerald-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 transition-all duration-300 ease-in-out"></div>
      </div>

      <div className="relative z-10 fade-enter-active">

        <div className="pt-12 pb-8 px-4 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl shadow-xs cursor-pointer shrink-0 transition-all duration-300 ease-in-out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50/80 dark:bg-teal-900/30 backdrop-blur-sm border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-300 font-semibold text-xs mb-3 shadow-xs transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                  Trip Dashboard
                </div>
                {isInitializing ? (
                  <div className="h-10 sm:h-12 w-48 sm:w-60 bg-slate-300/50 dark:bg-slate-800 rounded-xl animate-pulse "></div>
                ) : (
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors duration-300 ease-in-out">{trip.name}</h2>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-16 mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="space-y-8">
              <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/60 dark:border-slate-700/50 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                <h3 className="font-bold mb-5 flex items-center gap-2 text-lg">
                  <div className="text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors duration-300 ease-in-out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" /></svg>
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 transition-colors duration-300 ease-in-out">Guest List</span>
                </h3>

                <ul className="mb-6 flex flex-wrap gap-2.5">
                  {isInitializing ? (
                    [1, 2, 3].map((i) => (
                      <li key={`skel-guest-${i}`} className="h-[37px] w-22 bg-indigo-100/50 dark:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-800/50 rounded-xl animate-pulse"></li>
                    ))
                  ) :
                    members.map((m, index) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-sm px-4 py-2 rounded-xl font-bold shadow-xs dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 transition-colors duration-300 ease-in-out"
                      >
                        {index === 0 && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400 -ml-0.5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        )}
                        {m.name}
                      </li>
                    ))}
                </ul>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 transition-[border-color] duration-300 ease-in-out">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0 transition-colors duration-300 ease-in-out">Add Friend</label>
                    <button onClick={handleCopyLink} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1.5 cursor-pointer group transition-colors duration-300 ease-in-out">
                      {isCopied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          Click to copy invite link
                        </>
                      )}
                    </button>
                  </div>
                  <form onSubmit={handleAddFriend} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Name"
                      required
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl w-full outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 ease-in-out"
                    />
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl w-full outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 ease-in-out"
                    />
                    <button
                      type="submit"
                      disabled={activeAction === 'ADD_FRIEND'}
                      className="flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold w-full py-3.5 rounded-xl cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-300 ease-in-out"
                    >
                      {activeAction === 'ADD_FRIEND' ? (
                        <svg className="animate-spin h-5 w-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : 'Add to Trip'}
                    </button>
                  </form>
                </div>
              </div>

              <form onSubmit={handleAddExpense} className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/60 dark:border-slate-700/50 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <div className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors duration-300 ease-in-out">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="receipt-add" data-name="Flat Line" className="icon flat-line w-6 h-6"><g id="SVGRepo_bgCarrier" strokeWidth="0" /><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" /><g id="SVGRepo_iconCarrier"><path id="secondary" d="M21,4V18.5a2.5,2.5,0,0,1-5,0V16H5V4A1,1,0,0,1,6,3H20A1,1,0,0,1,21,4Z" fill="none" strokeWidth={2} /><path id="primary" d="M13,7v5m2.5-2.5h-5M21,4V18.5a2.5,2.5,0,0,1-5,0V16H5V4A1,1,0,0,1,6,3H20A1,1,0,0,1,21,4ZM16,18.5V16H3v2.5A2.5,2.5,0,0,0,5.5,21h13A2.5,2.5,0,0,1,16,18.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></g></svg>
                  </div>
                  <span className="text-slate-900 dark:text-white transition-colors duration-300 ease-in-out">Add Expense</span>
                </h3>

                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider transition-colors duration-300 ease-in-out">Who paid?</label>
                  <select value={payerId} onChange={e => setPayerId(e.target.value)} required className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3.5 w-full rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-slate-200 cursor-pointer appearance-none transition-colors duration-300 ease-in-out">
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider transition-colors duration-300 ease-in-out">Details</label>
                  <input type="text" placeholder="What was it for? (e.g., Dinner)" required value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-3.5 w-full mb-3 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 ease-in-out" />

                  <div className="flex items-center bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                    <span className="pl-4 font-bold text-slate-400 dark:text-slate-500 text-lg transition-colors duration-300 ease-in-out">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                      value={expenseAmount}
                      onChange={e => {
                        const val = e.target.value;
                        // The Hand-off: If they chevron down to 0, clear the input so the styled placeholder takes over
                        setExpenseAmount(val === '0' ? '' : val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e') {
                          e.preventDefault();
                        }
                      }}
                      className="bg-transparent p-3.5 w-full outline-none text-lg font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors duration-300 ease-in-out"
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-7 transition-[background-color,border-color] duration-300 ease-in-out">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider transition-colors duration-300 ease-in-out">Split equally amongst:</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {members.map(m => (
                      <label key={m.id} className="flex items-center p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-[background-color,border-color] duration-300 ease-in-out">
                        <input type="checkbox" checked={selectedSplits.includes(m.id)} onChange={() => toggleSplit(m.id)} className="mr-3 h-5 w-5 text-emerald-500 dark:text-emerald-400 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 dark:focus:ring-emerald-400 cursor-pointer bg-transparent transition-colors duration-300 ease-in-out" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors duration-300 ease-in-out">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={activeAction === 'ADD_EXPENSE'} className="flex justify-center items-center bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold w-full py-4 rounded-xl hover:shadow-sm hover:-translate-y-0.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-lg transition-all duration-300 ease-in-out">
                  {activeAction === 'ADD_EXPENSE' ? 'Saving...' : 'Save Expense'}
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/60 dark:border-slate-700/50 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <div className="text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors duration-300 ease-in-out">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-8 h-8" fill="currentColor">
                        <g id="layer1"><path d="M 6.5 1 A 6.5 6.5 0 0 0 0 7.5 A 6.5 6.5 0 0 0 6.5 14 A 6.5 6.5 0 0 0 13 7.5 A 6.5 6.5 0 0 0 6.5 1 z M 6.5 2 A 5.5 5.5 0 0 1 12 7.5 A 5.5 5.5 0 0 1 6.5 13 A 5.5 5.5 0 0 1 1 7.5 A 5.5 5.5 0 0 1 6.5 2 z M 6 4 L 6 5 C 5.177495 5 4.5 5.677495 4.5 6.5 C 4.5 7.322505 5.177495 8 6 8 L 7 8 C 7.282065 8 7.5 8.217935 7.5 8.5 C 7.5 8.782065 7.282065 9 7 9 L 6 9 L 4.5 9 L 4.5 10 L 6 10 L 6 11 L 7 11 L 7 10 C 7.822504 10 8.5 9.322505 8.5 8.5 C 8.5 7.677495 7.822504 7 7 7 L 6 7 C 5.717935 7 5.5 6.782065 5.5 6.5 C 5.5 6.217935 5.717935 6 6 6 L 7 6 L 8.5 6 L 8.5 5 L 7 5 L 7 4 L 6 4 z M 13.851562 6.0175781 C 13.917903 6.3459879 13.954929 6.6832329 13.976562 7.0253906 C 16.790577 7.267363 19 9.6232872 19 12.5 C 19 15.537566 16.537566 18 13.5 18 C 11.255696 18 9.3278145 16.653823 8.4726562 14.726562 C 8.1476973 14.815637 7.8153176 14.885044 7.4746094 14.929688 C 8.4374925 17.314715 10.77003 19 13.5 19 C 17.089851 19 20 16.089851 20 12.5 C 20 9.0289309 17.27678 6.2014281 13.851562 6.0175781 z M 13.849609 9 C 13.704848 9.7079885 13.454794 10.379092 13.125 11 L 14 11 L 15.5 11 L 15.5 10 L 14 10 L 14 9 L 13.849609 9 z M 12.619141 11.818359 C 12.425617 12.091462 12.211734 12.34917 11.984375 12.59375 C 12.252738 12.843286 12.608526 13 13 13 L 14 13 C 14.282065 13 14.5 13.217935 14.5 13.5 C 14.5 13.782065 14.282065 14 14 14 L 13 14 L 11.5 14 L 11.5 15 L 13 15 L 13 16 L 14 16 L 14 15 C 14.822504 15 15.5 14.322505 15.5 13.5 C 15.5 12.677495 14.822504 12 14 12 L 13 12 C 12.842293 12 12.709869 11.92773 12.619141 11.818359 z" /></g>
                      </svg>
                    </div>
                    <span className="text-slate-900 dark:text-white transition-colors duration-300 ease-in-out">Settle Debts</span>
                  </h3>
                  <button onClick={handleCalculate} disabled={activeAction === 'CALCULATE_DEBTS'} className="bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed transition-colors duration-300 ease-in-out">
                    {activeAction === 'CALCULATE_DEBTS' && <svg className="animate-spin mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {debts ? 'Recalculate' : 'Calculate'}
                  </button>
                </div>

                <ul className={`space-y-3 custom-scrollbar pr-2 ${debts?.transactions?.length > 5 ? 'max-h-[600px] overflow-y-auto overflow-x-hidden' : ''}`}>
                  {!debts && (
                    <li className="flex flex-col items-center justify-center py-10 bg-indigo-100/20 dark:bg-slate-800/30 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-900 text-center transition-[background-color,border-color] duration-300 ease-in-out">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" className="w-12 h-12 mb-2 text-slate-400 dark:text-indigo-300/80 transition-colors duration-300 ease-in-out"><path d="M1,13.36h20c0.199,0,0.36-0.161,0.36-0.36V3c0-0.199-0.161-0.36-0.36-0.36H1 C0.801,2.64,0.64,2.801,0.64,3v10C0.64,13.199,0.801,13.36,1,13.36z M1.36,10.396c1.166,0.161,2.083,1.078,2.244,2.244H1.36V10.396z M1.36,9.677V6.323C2.922,6.154,4.154,4.922,4.323,3.36h13.353c0.169,1.562,1.402,2.794,2.964,2.964v3.353 c-1.562,0.17-2.794,1.402-2.964,2.964H4.323C4.154,11.078,2.922,9.846,1.36,9.677z M18.397,12.64 c0.161-1.165,1.077-2.082,2.243-2.244v2.244C20.64,12.64,18.397,12.64,18.397,12.64z M20.64,5.604 c-1.166-0.161-2.082-1.078-2.243-2.244h2.243V5.604z M3.604,3.36C3.443,4.525,2.525,5.443,1.36,5.604V3.36H3.604z M11,11.36 c1.853,0,3.36-1.507,3.36-3.36S12.853,4.64,11,4.64S7.64,6.147,7.64,8S9.147,11.36,11,11.36z M11,5.36c1.456,0,2.64,1.185,2.64,2.64 s-1.185,2.64-2.64,2.64S8.36,9.456,8.36,8S9.544,5.36,11,5.36z M31,18.64H11c-0.199,0-0.36,0.161-0.36,0.36v10 c0,0.199,0.161,0.36,0.36,0.36h20c0.199,0,0.36-0.161,0.36-0.36V19C31.36,18.801,31.199,18.64,31,18.64z M30.64,21.603 c-1.165-0.161-2.082-1.077-2.243-2.243h2.243V21.603z M30.64,22.324v3.352c-1.561,0.17-2.794,1.402-2.964,2.964H14.323 c-0.17-1.562-1.402-2.794-2.964-2.964v-3.352c1.562-0.169,2.794-1.402,2.964-2.964h13.353C27.846,20.922,29.078,22.154,30.64,22.324 z M13.604,19.36c-0.161,1.166-1.078,2.082-2.244,2.243V19.36H13.604z M11.36,26.397c1.165,0.161,2.082,1.077,2.244,2.243H11.36 V26.397z M28.397,28.64c0.161-1.165,1.077-2.082,2.243-2.243v2.243H28.397z M21,20.64c-1.853,0-3.36,1.508-3.36,3.36 s1.508,3.36,3.36,3.36s3.36-1.508,3.36-3.36S22.853,20.64,21,20.64z M21,26.64c-1.456,0-2.64-1.184-2.64-2.64s1.184-2.64,2.64-2.64 s2.64,1.184,2.64,2.64S22.456,26.64,21,26.64z M1.87,23.64H8v0.721H1.87l2.385,2.385l-0.509,0.51L0.491,24l3.255-3.255l0.509,0.51 L1.87,23.64z M30.131,8.36H24V7.64h6.131l-2.386-2.386l0.51-0.509L31.509,8l-3.254,3.254l-0.51-0.509L30.131,8.36z" /></svg>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm transition-colors duration-300 ease-in-out">Click calculate to view optimal transactions.</p>
                    </li>
                  )}
                  {debts?.transactions.length === 0 && (
                    <li className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center flex items-center justify-center gap-2 transition-[background-color,border-color] duration-300 ease-in-out">
                      <svg className="w-5 h-5 text-indigo-700 dark:text-indigo-300 transition-colors duration-300 ease-in-out" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 transition-colors duration-300 ease-in-out">All debts are settled!</span>
                    </li>
                  )}
                  {debts?.transactions.map((tx, i) => {
                    const fromName = members.find(m => String(m.id) === String(tx.from))?.name || `User #${tx.from}`;
                    const toName = members.find(m => String(m.id) === String(tx.to))?.name || `User #${tx.to}`;
                    return (
                      <li key={i} className="p-4 sm:p-5 bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl flex justify-between items-center hover:bg-white/80 dark:hover:bg-slate-800 hover:shadow-xs fade-enter-active transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                        <div className="flex flex-col">
                          <span>
                            <strong className="font-extrabold text-indigo-900 dark:text-indigo-300 transition-colors duration-300 ease-in-out">{fromName}</strong>
                            <span className="text-slate-800 dark:text-slate-200"> must pay </span>
                            <strong className="font-extrabold text-indigo-900 dark:text-indigo-300 transition-colors duration-300 ease-in-out">{toName}</strong>
                          </span>
                        </div>
                        <span className="font-extrabold text-lg bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm transition-colors duration-300 ease-in-out">${parseFloat(tx.amount).toFixed(2)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/60 dark:border-slate-700/50 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">
                <h3 className="font-bold text-xl mb-6 flex items-center">
                  <div className="text-slate-700 dark:text-slate-300 flex items-center justify-center mr-2 transition-colors duration-300 ease-in-out">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className='w-8 h-8' viewBox="0 0 100 100" xmlSpace="preserve"><g><path d="M28.1,48C28,48.7,28,49.3,28,50h-6c0-0.7,0-1.3,0.1-2H28.1z" /></g><g><g><path d="M51.5,36h-3c-0.8,0-1.5,0.7-1.5,1.5v13.1c0,0.4,0.2,0.8,0.4,1.1l8.4,8.4c0.6,0.6,1.5,0.6,2.1,0l2.1-2.1 c0.6-0.6,0.6-1.5,0-2.1L53,48.8V37.5C53,36.7,52.3,36,51.5,36z" /></g><g><path d="M50,22c-14.8,0-26.9,11.5-27.9,26c0,0.3-0.1,0.7-0.1,1h-4.5c-1.3,0-2,1.5-1.2,2.4l7.5,9.1 c0.6,0.7,1.7,0.7,2.3,0l7.5-9.1c0.8-1,0.1-2.4-1.2-2.4H28c0-0.3,0-0.7,0-1c1-11.2,10.5-20,21.9-20c13,0,23.3,11.3,21.9,24.5 C70.8,62,61.8,71,52.2,71.9c-7.1,0.7-13.8-1.9-18.5-7c-0.6-0.7-1.4-1.1-2.2-0.1l-2.4,2.9c-0.5,0.6-0.1,1,0.4,1.5 c5.4,5.7,12.8,8.9,20.8,8.8c14.4-0.2,26.5-11.6,27.5-26C79.1,35.7,66.1,22,50,22z" /></g></g></svg>
                  </div>
                  <span className="text-slate-900 dark:text-white transition-colors duration-300 ease-in-out">Recent Expenses</span>
                </h3>

                <ul className={`space-y-3 custom-scrollbar pr-2 ${expenses.length > 7 ? 'max-h-[687px] overflow-y-auto overflow-x-hidden' : ''}`}>
                  {isInitializing ? (
                    [1, 2, 3, 4].map((i) => (
                      <li key={`skel-exp-${i}`} className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex justify-between items-center">
                        <div className="flex flex-col gap-2.5">
                          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-sm animate-pulse"></div>
                        </div>
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                      </li>
                    ))
                  ) : expenses.length === 0 && (
                    <li className="flex flex-col items-center justify-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center transition-[background-color,border-color] duration-300 ease-in-out">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3 transition-colors duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm4 0a.5.5 0 11-1 0 .5.5 0 011 0zm-4 4a.5.5 0 11-1 0 .5.5 0 011 0zm4 0a.5.5 0 11-1 0 .5.5 0 011 0z" />
                      </svg>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm transition-colors duration-300 ease-in-out">No expenses logged yet.</p>
                    </li>
                  )}
                  {expenses.map(exp => (
                    // --- NEW: Added 'group' class and the delete button logic to the expense list item ---
                    <li key={exp.id || exp.description} className="p-4 sm:p-5 bg-slate-100/60 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl flex justify-between items-center fade-enter-active   hover:shadow-xs transition-[background-color,border-color,box-shadow] duration-300 ease-in-out group">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-base transition-colors duration-300 ease-in-out">
                          {exp.description}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 tracking-wider transition-colors duration-300 ease-in-out">
                          Paid by {exp.payer_name?.toUpperCase()} • {new Date(exp.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* We added 'relative' to the container so the button can be absolutely positioned on desktop */}
                      <div className="flex items-center gap-3 relative">

                        {/* We changed transition-colors to transition-all, and added lg:group-hover:-translate-x-10 to slide it left */}
                        <span className="font-extrabold text-slate-900 dark:text-white text-xl transition-all duration-300 ease-in-out lg:group-hover:-translate-x-10">
                          ${parseFloat(exp.total_amount).toFixed(2)}
                        </span>

                        <button
                          onClick={(e) => confirmDeleteExpense(exp.id, e)}
                          /* 
                            We added: lg:absolute lg:right-0 (takes it out of the flow on desktop so the amount sits flush right) 
                            and lg:pointer-events-none lg:group-hover:pointer-events-auto (prevents accidental clicks when invisible) 
                          */
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:bg-red-100 dark:active:bg-red-900/50 active:text-red-600 dark:active:text-red-300 active:scale-90 rounded-xl opacity-100 lg:opacity-0 lg:absolute lg:right-0 lg:pointer-events-none lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 cursor-pointer transition-all duration-300 ease-in-out"
                          title="Delete Expense"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- NEW: The Expense Delete Confirmation Dialog --- */}
      <dialog
        ref={expenseDialogRef}
        onCancel={cancelDeleteExpense}
        className="bg-transparent p-0 m-auto backdrop:bg-slate-900/60 dark:backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm open:animate-[pure-fade_150ms_ease-out_forwards] backdrop:animate-[pure-fade_150ms_ease-out_forwards]"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out">

          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-6 mx-auto transition-[background-color] duration-300 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-2xl font-extrabold text-center text-slate-900 dark:text-white mb-2 transition-colors duration-300 ease-in-out">Delete this expense?</h3>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm leading-relaxed transition-colors duration-300 ease-in-out">
            This action cannot be undone. It will be removed from the trip ledger, and all debts will be recalculated.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={cancelDeleteExpense}
              className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition-all duration-300 ease-in-out"
            >
              Cancel
            </button>
            <button
              onClick={executeDeleteExpense}
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold rounded-xl shadow-[0_8px_30px_rgb(220,38,38,0.3)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300 ease-in-out"
            >
              Delete
            </button>
          </div>

        </div>
      </dialog>

    </div>
  );
}