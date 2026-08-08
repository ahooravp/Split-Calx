// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';
import { AppProvider } from './contexts/AppProvider'
import TripsPage from './pages/TripsPage';
import TripDashboard from './pages/TripDashboard';
import InvitePage from './pages/InvitePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext();
  return currentUser ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <AppProvider>
      <div className="bg-gray-50 text-gray-800 font-sans min-h-screen">
        <div className="max-w-5xl mx-auto p-4 sm:p-8">
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes (Dashboard, Trips, etc.) */}
              <Route path="/invite/:token" element={<InvitePage />} />
              <Route
                path="/trips"
                element={
                  <ProtectedRoute>
                    <TripsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips/:tripId"
                element={
                  <ProtectedRoute>
                    <TripDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </div>
      </div>
    </AppProvider>
  );
}