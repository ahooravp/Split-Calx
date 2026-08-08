// src/pages/TripDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function TripDashboard() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { token, currentUser, showToast, clearSession } = useAppContext();
  const [activeAction, setActiveAction] = useState(null);

  const [trip, setTrip] = useState({ name: 'Loading...', share_token: '' });
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState(null);

  // UI States
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form States
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedSplits, setSelectedSplits] = useState([]);

  // Data Fetching
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

  // 2. fetchMembers uses 'prev' to remove payerId from the dependency array
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);

        // BULLETPROOF FIX: Use 'prev' state to check if payerId exists. 
        // This removes payerId from the useCallback dependencies below.
        setPayerId((prev) => {
          if (prev) return prev; // Keep existing ID if already set
          return data.find(m => m.id === currentUser.id)?.id || data[0]?.id || '';
        });

        setSelectedSplits(data.map(m => m.id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [tripId, token, currentUser]); // Notice: payerId is gone from here.

  // 3. fetchExpenses is stabilized
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

  // 4. The Effect is now safe
  useEffect(() => {
    // Explicitly define an async function inside the effect
    const initializeDashboard = async () => {
      // Execute all data fetching concurrently. 
      // The 'await' proves to the linter that execution yields before state is set.
      await Promise.all([
        fetchTripDetails(),
        fetchMembers(),
        fetchExpenses()
      ]);
    };

    initializeDashboard();
  }, [fetchTripDetails, fetchMembers, fetchExpenses]);

  // Handlers
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
    setActiveAction('ADD_EXPENSE');
    if (selectedSplits.length === 0) return showToast('Select at least one person.', true);

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
        if (debts) handleCalculate(); // Refresh debts if currently showing
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

  const visibleExpenses = showAllExpenses ? expenses : expenses.slice(0, 10);

  return (
    <div className="fade-enter-active">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-6 mb-8 mt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/trips')} className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Trip Dashboard</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{trip.name}</h2>
          </div>
        </div>
        <button onClick={() => { clearSession(); navigate('/'); }} className="text-red-500 bg-white border border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-people-fill"
                viewBox="0 0 16 16"
              >
                <path
                  d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"
                />
              </svg>
              Guest List</h3>
            <ul className="mb-5 flex flex-wrap gap-2">
              {members.map(m => (
                <li key={m.id} className="bg-blue-50 border border-blue-100 text-blue-700 text-sm px-3 py-1.5 rounded-lg font-bold shadow-sm">{m.name}</li>
              ))}
            </ul>
            <div className="border-t border-gray-100 pt-5 mt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-0">Add Friend</label>
                <button onClick={handleCopyLink} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1.5 transition">
                  {isCopied ? 'Copied!' : 'Copy Invite Link'}
                </button>
              </div>
              <form onSubmit={handleAddFriend} className="flex flex-col gap-3">
                <input type="text" placeholder="Name (Required)" required value={inviteName} onChange={e => setInviteName(e.target.value)} className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="email" placeholder="Email (Optional)" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={activeAction === 'ADD_FRIEND'} className=" flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-4 py-2.5 rounded-xl transition w-full disabled:opacity-75 disabled:cursor-not-allowed">
                  {activeAction === 'ADD_FRIEND' ? <svg className="animate-spin mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg> : null}
                  {activeAction === 'ADD_FRIEND' ? 'Adding...' : 'Add to Trip'}
                </button>
              </form>
            </div>
          </div>

          <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-xl text-gray-800 mb-5 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#000000"
                width="800px"
                height="800px"
                viewBox="0 0 24 24"
                id="receipt-add"
                data-name="Flat Line"
                className="icon flat-line w-6 h-6"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <g id="SVGRepo_iconCarrier">
                  <path
                    id="secondary"
                    d="M21,4V18.5a2.5,2.5,0,0,1-5,0V16H5V4A1,1,0,0,1,6,3H20A1,1,0,0,1,21,4Z"
                    style={{ fill: "#ffffff", strokeWidth: 2 }}
                  />

                  <path
                    id="primary"
                    d="M13,7v5m2.5-2.5h-5M21,4V18.5a2.5,2.5,0,0,1-5,0V16H5V4A1,1,0,0,1,6,3H20A1,1,0,0,1,21,4ZM16,18.5V16H3v2.5A2.5,2.5,0,0,0,5.5,21h13A2.5,2.5,0,0,1,16,18.5Z"
                    style={{
                      fill: "none",
                      stroke: "#000000",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2
                    }}
                  />
                </g>
              </svg>
              Add Expense</h3>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Who paid?</label>
              <select value={payerId} onChange={e => setPayerId(e.target.value)} required className="bg-gray-50 border border-gray-200 p-3 w-full rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium cursor-pointer">
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Details</label>
              <input type="text" placeholder="What was it for?" required value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 w-full mb-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-green-500 mb-5">
                <span className="pl-4 font-bold text-gray-400 text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  className="bg-transparent p-3 w-full outline-none text-lg font-bold"
                />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">Split equally amongst:</label>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {members.map(m => (
                  <label key={m.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                    <input type="checkbox" checked={selectedSplits.includes(m.id)} onChange={() => toggleSplit(m.id)} className="mr-3 h-5 w-5 text-green-500 rounded focus:ring-green-500" />
                    <span className="text-sm font-bold text-gray-700">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={activeAction === 'ADD_EXPENSE'} className="bg-green-500 hover:bg-green-600 text-white font-extrabold w-full py-4 rounded-xl transition shadow-xl text-lg disabled:opacity-75 disabled:cursor-not-allowed">
              {activeAction === 'ADD_EXPENSE' ? 'Saving...' : 'Save Expense'}
            </button>
          </form>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill=""
                  viewBox="0 0 32 32"
                  className="w-9 h-9 text-indigo-500"
                >
                  <path
                    d="M1,13.36h20c0.199,0,0.36-0.161,0.36-0.36V3c0-0.199-0.161-0.36-0.36-0.36H1  C0.801,2.64,0.64,2.801,0.64,3v10C0.64,13.199,0.801,13.36,1,13.36z M1.36,10.396c1.166,0.161,2.083,1.078,2.244,2.244H1.36V10.396z   M1.36,9.677V6.323C2.922,6.154,4.154,4.922,4.323,3.36h13.353c0.169,1.562,1.402,2.794,2.964,2.964v3.353  c-1.562,0.17-2.794,1.402-2.964,2.964H4.323C4.154,11.078,2.922,9.846,1.36,9.677z M18.397,12.64  c0.161-1.165,1.077-2.082,2.243-2.244v2.244C20.64,12.64,18.397,12.64,18.397,12.64z M20.64,5.604  c-1.166-0.161-2.082-1.078-2.243-2.244h2.243V5.604z M3.604,3.36C3.443,4.525,2.525,5.443,1.36,5.604V3.36H3.604z M11,11.36  c1.853,0,3.36-1.507,3.36-3.36S12.853,4.64,11,4.64S7.64,6.147,7.64,8S9.147,11.36,11,11.36z M11,5.36c1.456,0,2.64,1.185,2.64,2.64  s-1.185,2.64-2.64,2.64S8.36,9.456,8.36,8S9.544,5.36,11,5.36z M31,18.64H11c-0.199,0-0.36,0.161-0.36,0.36v10  c0,0.199,0.161,0.36,0.36,0.36h20c0.199,0,0.36-0.161,0.36-0.36V19C31.36,18.801,31.199,18.64,31,18.64z M30.64,21.603  c-1.165-0.161-2.082-1.077-2.243-2.243h2.243V21.603z M30.64,22.324v3.352c-1.561,0.17-2.794,1.402-2.964,2.964H14.323  c-0.17-1.562-1.402-2.794-2.964-2.964v-3.352c1.562-0.169,2.794-1.402,2.964-2.964h13.353C27.846,20.922,29.078,22.154,30.64,22.324  z M13.604,19.36c-0.161,1.166-1.078,2.082-2.244,2.243V19.36H13.604z M11.36,26.397c1.165,0.161,2.082,1.077,2.244,2.243H11.36  V26.397z M28.397,28.64c0.161-1.165,1.077-2.082,2.243-2.243v2.243H28.397z M21,20.64c-1.853,0-3.36,1.508-3.36,3.36  s1.508,3.36,3.36,3.36s3.36-1.508,3.36-3.36S22.853,20.64,21,20.64z M21,26.64c-1.456,0-2.64-1.184-2.64-2.64s1.184-2.64,2.64-2.64  s2.64,1.184,2.64,2.64S22.456,26.64,21,26.64z M1.87,23.64H8v0.721H1.87l2.385,2.385l-0.509,0.51L0.491,24l3.255-3.255l0.509,0.51  L1.87,23.64z M30.131,8.36H24V7.64h6.131l-2.386-2.386l0.51-0.509L31.509,8l-3.254,3.254l-0.51-0.509L30.131,8.36z"
                  />
                  <rect style={{ fill: "none" }} width="32" height="32" />
                </svg>
                Settle Debts</h3>
              <button onClick={handleCalculate} disabled={activeAction === 'CALCULATE_DEBTS'} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-sm transition flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed">
                {activeAction === 'CALCULATE_DEBTS' ? <svg className="animate-spin mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> : null}
                {debts ? 'Recalculate' : 'Calculate'}

              </button>
            </div>
            <ul className="space-y-3">
              {!debts && <li className="text-gray-400 italic text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">Click calculate to view optimal transactions.</li>}
              {debts?.transactions.length === 0 && <li className="text-green-700 font-bold p-4 bg-green-50 rounded-xl border border-green-200 text-center shadow-sm flex items-center justify-center gap-2">All debts are settled!</li>}
              {debts?.transactions.map((tx, i) => {
                const fromName = members.find(m => String(m.id) === String(tx.from))?.name || `User #${tx.from}`;
                const toName = members.find(m => String(m.id) === String(tx.to))?.name || `User #${tx.to}`;
                return (
                  <li key={i} className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 flex justify-between items-center shadow-sm fade-enter-active">
                    <div className="flex flex-col">
                      <span><strong className="font-extrabold text-indigo-900">{fromName}</strong> must pay <strong className="font-extrabold text-indigo-900">{toName}</strong></span>
                    </div>
                    <span className="font-extrabold text-xl bg-white px-3 py-1 rounded-lg text-indigo-600 shadow-sm border border-indigo-100">${parseFloat(tx.amount).toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="w-7 h-7 -scale-x-100"
              >
                <path
                  d="M160 336V48l32 16 32-16 31.94 16 32.37-16L320 64l31.79-16 31.93 16L416 48l32.01 16L480 48v224"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="32px"
                />
                <path
                  d="M480 272v112a80 80 0 0 1-80 80 80 80 0 0 1-80-80v-48H48a15.86 15.86 0 0 0-16 16c0 64 6.74 112 80 112h288"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="32px"
                />
                <path
                  d="M224 144h192M288 224h128"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="32px"
                />
              </svg>
              Recent Expenses</h3>
            <ul className="space-y-3 mb-4">
              {expenses.length === 0 && <li className="text-gray-400 italic text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">No expenses logged yet.</li>}
              {visibleExpenses.map(exp => (
                <li key={exp.id || exp.description} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center transition hover:bg-white hover:shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{exp.description}</span>
                    <span className="text-xs font-bold text-gray-400 mt-1 tracking-wider">Paid by {exp.payer_name}</span>
                  </div>
                  <span className="font-extrabold text-gray-900 text-lg">${parseFloat(exp.total_amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {expenses.length > 10 && (
              <button onClick={() => setShowAllExpenses(!showAllExpenses)} className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-bold py-3 mt-1 rounded-xl hover:bg-gray-50 transition">
                {showAllExpenses ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}