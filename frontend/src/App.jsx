// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './contexts/AppContext';
import { AppProvider } from './contexts/AppProvider'
import Dashboard from './pages/Dashboard';
import TripDashboard from './pages/TripDashboard';
import InvitePage from './pages/InvitePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/Header';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext();
  return currentUser ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <AppProvider>
      <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
        <Router>
          <Header />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes (Dashboard, Trips, etc.) */}
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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
    </AppProvider>
  );
}