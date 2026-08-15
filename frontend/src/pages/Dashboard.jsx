// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function Dashboard() {
  const { currentUser, token, showToast } = useAppContext();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const dialogRef = useRef(null);

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


// 1. Triggers the custom modal instantly
  const confirmDelete = (tripId, e) => {
    e.stopPropagation(); 
    setTripToDelete(tripId); 
    
    // We use a micro-timeout to let React render the dialog first before commanding it to open
    setTimeout(() => {
      if (dialogRef.current) dialogRef.current.showModal();
    }, 0);
  };

  // 2. Keeps React state clean when canceling or pressing ESC
  const cancelDelete = () => {
    if (dialogRef.current) dialogRef.current.close();
    setTripToDelete(null);
  };

  // 3. Executes the deletion
  const executeDelete = async () => {
    if (!tripToDelete) return;
    const idToKill = tripToDelete;
    
    cancelDelete(); // Snaps the modal shut instantly

    try {
      const res = await fetch(`/api/trips/${idToKill}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast('Trip deleted successfully!');
        fetchTrips(); 
      } else {
        showToast(data.error, true);
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Server error while deleting', true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 relative flex flex-col overflow-hidden">

      {/* Scroll-Mapped Ambient Journey */}
      <div className="absolute top-[-10%] left-[-5%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-5%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[30rem] md:w-[40rem] h-[30rem] md:h-[40rem] bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>

      <div className="pt-12 pb-8 px-6 sm:px-12 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/80 backdrop-blur-sm border border-indigo-200 text-indigo-900 font-semibold text-xs mb-4 shadow-xs">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Welcome back, {currentUser?.name}
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          </div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-12 pb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          <div className="md:col-span-5 bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-2xl text-slate-900 mb-2">Start a New Trip</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">Create a dedicated hub to track expenses and split the bill with your friends.</p>
            </div>

            <form onSubmit={handleCreateTrip} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="e.g., Miami 2026"
                required
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl w-full outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-700"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex justify-center items-center cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-bold w-full py-4 rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
              >
                {!isLoading && (
                  <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 mr-1' viewBox="0 0 24 24" fill="none">
                    <path d="M11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V11H16C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13H13V16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16V13H8C7.44771 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H11V8Z" fill="currentColor" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM3.00683 12C3.00683 16.9668 7.03321 20.9932 12 20.9932C16.9668 20.9932 20.9932 16.9668 20.9932 12C20.9932 7.03321 16.9668 3.00683 12 3.00683C7.03321 3.00683 3.00683 7.03321 3.00683 12Z" fill="currentColor" />
                  </svg>
                )}
                {isLoading ? 'Creating...' : 'Create Trip'}
              </button>
            </form>
          </div>

          <div className="md:col-span-7 bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.04)] border border-white/60">
            <h3 className="font-bold text-xl text-slate-900 mb-5">Recent Trips</h3>

            {trips.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="currentcolor" className='w-12 h-12 text-indigo-400 mb-1' version="1.1" id="Layer_1" viewBox="0 0 268.321 268.321" xml:space="preserve">
                  <g>
                    <g>
                      <path d="M259.342,39.744l0.159-0.154c9.298-9.305,9.598-24.138,0.668-33.07c-4.204-4.204-9.86-6.52-15.92-6.52    c-6.421,0-12.514,2.553-17.152,7.188l-20.41,21.81l-73-21.854l-15.131,15.135c-1.907,1.902-2.956,4.437-2.956,7.131    c0,2.696,1.049,5.227,2.956,7.129l0.664,0.664l52.728,29.018l-7.715,8.372c-10.226-6.622-21.62-11.498-33.85-14.282    c-7.724-1.761-15.624-2.652-23.479-2.652c-3.963,0-7.874,0.238-11.734,0.664l-0.366-0.406c-0.172,0.154-0.366,0.328-0.555,0.505    c-43.823,5.198-79.893,37.113-89.931,81.18c-6.252,27.427-1.446,55.647,13.528,79.458c14.974,23.809,38.329,40.362,65.758,46.609    c7.724,1.761,15.625,2.652,23.479,2.652c49.415,0,91.602-33.689,102.589-81.927c1.962-8.606,2.833-17.291,2.643-25.89    c0.6-2.204,0.496-4.607-0.436-7.224c-1.49-16.284-6.776-32.106-15.735-46.347c-1.089-1.73-2.235-3.415-3.415-5.061l7.832-7.219    l29.254,53.151l0.67,0.668c1.905,1.898,4.435,2.945,7.122,2.945c2.687,0,5.211-1.045,7.12-2.947l15.14-15.137l-21.999-73.498    L259.342,39.744z M54.354,238.588c-10.012-6.968-18.622-15.935-25.313-26.574c-11.901-18.924-16.429-41.032-13.054-62.915    c5.897,1.589,11.851,3.937,14.137,5.57c-0.086,0.608-0.181,1.226-0.276,1.841c-0.884,5.738-2.22,14.405,4.845,19.548    c6.183,4.497,11.842,0.291,14.423-1.883c1.036,0.835,2.165,1.666,3.326,2.524c1.812,1.336,5.008,3.695,6.157,5.13    c-0.364,1.268-0.899,2.766-1.422,4.226c-2.052,5.731-4.175,11.654-0.225,15.816c1.362,1.675,5.434,9.375,6.474,12.148    c-0.022,0.924,0.046,1.975,0.134,3.344c0.093,1.411,0.298,4.592,0.088,5.886c-0.005-0.001-8.024,10.099-7.561,12.491    L54.354,238.588z M196.776,183.45c-9.609,42.183-46.49,71.642-89.693,71.642c-6.869,0-13.779-0.78-20.542-2.321    c-8.282-1.885-16.125-4.872-23.404-8.798c6.454-5.458,12.04-14.225,12.124-14.366c1.957-3.307,1.845-7.698,1.497-13.096    c-0.057-0.904-0.123-1.68-0.11-2.178c-0.009,0.311-0.066,0.558-0.108,0.734c1.06-4.693-5.319-15.497-8.388-20.099    c0.317-1.217,0.992-3.099,1.475-4.453c0.8-2.235,1.627-4.545,2.123-6.737c1.823-7.929-5.542-13.361-11.458-17.723    c-1.689-1.245-3.434-2.533-4.208-3.353c-2.663-2.808-7.149-4.975-13.693-0.104c0.117-1.4,0.362-2.985,0.529-4.078    c0.22-1.424,0.434-2.846,0.571-4.215c0.761-7.673-7.523-13.764-24.579-18.122c9.355-30.96,33.747-54.121,64.081-62.189    c-1.353,3.304-2.423,7.124-2.914,11.571c-0.284,2.568-0.652,4.894-0.977,6.942c-1.294,8.176-2.762,17.443,8.981,22.672    c6.401,2.859,10.867,3.329,14.458,3.708c1.585,0.165,2.912,0.306,4.29,0.619c0.399,1.988,0.145,6.073,0.042,7.751    c-0.145,2.343-0.302,4.869,0.447,6.988c0.968,5.348,5.641,24.889,23.814,37.494c-2.557,1.525-5.919,3.086-8.74,3.628    c-1.53,0.293-3.097,0.489-4.614,0.679c-6.205,0.778-14.703,1.838-18.259,11.639c-1.581,4.332-0.555,7.486,0.584,9.369    c2.83,4.68,8.337,5.418,12.358,5.956c0.648,0.086,1.558,0.209,2.105,0.317c2.489,1.823,10.257,6.986,18.309,6.986    c3.639,0,7.336-1.056,10.632-3.948c1.325-1.124,7.607-1.051,10.632-1.012c6.401,0.075,12.446,0.15,16.303-3.75    c1.894-1.918,2.861-4.422,2.795-7.25c-0.137-5.524,10.438-11.465,18.935-16.24c2.05-1.151,4.146-2.334,6.183-3.562    C197.976,177.522,197.451,180.492,196.776,183.45z M198.951,157.783c-1.918,2.429-8.903,6.357-13.257,8.802    c-11.377,6.393-24.171,13.581-25.56,25.465c-1.666,0.134-4.067,0.101-5.833,0.082c-6.774-0.075-14.432-0.174-19.524,4.303    c-2.202,1.933-8.903-1.043-12.73-4.025c-2.143-1.673-4.704-2.081-7.422-2.449c1.043-0.265,2.55-0.505,4.797-0.783    c1.644-0.207,3.509-0.439,5.462-0.813c5.93-1.137,21.382-7.625,22.67-16.198c0.536-3.567-1.186-6.871-4.504-8.63    c-19.685-10.4-22.705-31.423-22.822-32.285l-0.231-1.858c0.024-0.436,0.053-0.908,0.077-1.314    c0.392-6.309,1.12-18.054-8.147-20.891c-3.073-0.935-5.689-1.21-8-1.453c-3.203-0.335-5.967-0.626-10.455-2.63    c-1.6-0.712-1.933-1.182-1.933-1.182c-0.403-0.827,0.194-4.592,0.63-7.341c0.348-2.196,0.741-4.682,1.06-7.561    c0.857-7.737,3.974-12.596,6.948-15.88c2.226-0.159,4.466-0.258,6.73-0.258c6.867,0,13.777,0.78,20.54,2.321    c9.933,2.264,19.237,6.104,27.68,11.271l-0.661,0.716c-1.16,1.171-2.218,2.412-3.168,3.712l-23.648-6.122l-10.369,10.372    c-1.744,1.739-2.705,4.054-2.705,6.518c0,2.467,0.959,4.786,2.703,6.529l0.743,0.745l27.239,13.824l0.979,0.979l13.824,27.244    l0.745,0.743c1.741,1.744,4.06,2.705,6.525,2.705c2.467,0,4.786-0.961,6.52-2.7l10.376-10.372l-6.247-24.133    c1.228-0.906,2.396-1.911,3.505-3.007l1.415-1.303c0.693,1.002,1.389,2.002,2.044,3.043    C193.381,127.378,198.1,142.39,198.951,157.783z M244.93,129.556l-6.49,6.49l-34.432-62.567l-31.573,29.109l-0.187,0.179    c-1.453,1.448-3.073,2.619-4.814,3.476l-4.823,2.381l6.924,26.737l-1.032,1.032l-11.421-22.504l-3.955-3.959l-22.502-11.416    l1.029-1.029l26.351,6.822l2.354-4.902c0.864-1.792,2.059-3.461,3.553-4.958l29.199-31.672l-62.143-34.201l6.49-6.492    l73.288,21.938l25.769-27.543c2.134-2.096,4.874-3.249,7.733-3.249c2.526,0,4.858,0.939,6.567,2.645    c3.754,3.754,3.478,10.149-0.6,14.297l-27.368,25.599L244.93,129.556z" />
                    </g>
                  </g>
                </svg>
                <p className="text-slate-600 font-bold mb-1">No trips found</p>
                <p className="text-slate-400 text-sm font-medium">Create your first trip to get started.</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                {trips.map((trip) => (
                  <li
                    key={trip.id}
                    onClick={() => navigate(`/trips/${trip.id}`)}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-indigo-200 hover:shadow-sm flex justify-between items-center transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-700 text-lg group-hover:text-indigo-700 transition-colors">{trip.name}</span>
                    </div>

                    {/* Right side container for actions */}
                    <div className="flex items-center">

                      {/* The Delete Bin (Reveals on Hover) */}
                      <button
                        onClick={(e) => confirmDelete(trip.id, e)} // Updated this line
                        onTouchStart={() => { }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 active:text-red-600 active:scale-90 rounded-xl transition-all duration-75 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer mr-1"
                        title="Delete Trip"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Existing Navigation Arrow */}
                      <span className="text-slate-300 group-hover:text-indigo-500 text-xl transition-all duration-200 transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
      {/* Bulletproof Native HTML5 Dialog */}
      <dialog 
        ref={dialogRef}
        onCancel={cancelDelete} 
        className="bg-transparent p-0 m-auto backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:animate-[pure-fade_150ms_ease-out_forwards] backdrop:animate-[pure-fade_150ms_ease-out_forwards]"
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
          
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-6 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-extrabold text-center text-slate-900 mb-2">Delete this trip?</h3>
          <p className="text-center text-slate-500 mb-8 font-medium text-sm leading-relaxed">
            This action cannot be undone. All expenses and exact debt calculations will be permanently lost.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={cancelDelete} 
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={executeDelete} 
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-[0_8px_30px_rgb(220,38,38,0.3)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Delete Trip
            </button>
          </div>

        </div>
      </dialog>
    </div>
  );
}