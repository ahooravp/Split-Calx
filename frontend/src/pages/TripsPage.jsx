// src/pages/TripsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function TripsPage() {
  const { currentUser, token, clearSession, showToast } = useAppContext();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/trips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTrips(data);
    } catch (err) {
      console.error('Error fetching trips:', err);
    }
  }, [token]);

  useEffect(() => {
    const loadTrips = async () => {
      await fetchTrips();
    };
    loadTrips();
  }, [fetchTrips]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTripName, userId: currentUser.id }),
      });
      if (res.ok) {
        setNewTripName('');
        fetchTrips();
        showToast('Trip created successfully!');
      } else {
        const data = await res.json();
        showToast(data.error, true);
      }
    } catch (err) {
      showToast('Server error', true);
      console.log('Create trip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <div className="fade-enter-active">
      <div className="flex justify-between items-center border-b border-gray-200 pb-6 mb-8 mt-4">
        <div>
          <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">
            Welcome back, {currentUser?.name}.
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Trips</h2>
        </div>
        <button onClick={handleLogout} className="text-red-500 bg-white border border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">Start a New Trip</h3>
            <p className="text-sm text-gray-500 mb-4">Create a hub to split expenses with friends.</p>
          </div>
          <form onSubmit={handleCreateTrip} className="flex gap-2">
            <input type="text" placeholder="e.g., Miami 2026" required value={newTripName} onChange={(e) => setNewTripName(e.target.value)}
              className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex-grow outline-none focus:ring-2 focus:ring-green-500" />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl shadow-sm transition disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Recent Trips</h3>
          <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {trips.map((trip) => (
              <li key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)}
                className="p-4 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-white hover:border-blue-200 hover:border-2 flex justify-between items-center transition duration-200 group">
                <span className="font-bold text-gray-700 group-hover:text-blue-700">{trip.name}</span>
                <span className="text-gray-300 group-hover:text-blue-500 text-lg transition duration-200 transform group-hover:translate-x-1">&rarr;</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}