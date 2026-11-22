import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { TopHeader } from './components/TopHeader';
import { Footer } from './components/Footer';
import { DashboardView } from './views/DashboardView';
import { PipelineView } from './views/PipelineView';
import { ForecastView } from './views/ForecastView';
import { CustomersView } from './views/CustomersView';
import { CustomerProfileView } from './views/CustomerProfileView';
import { SalesRepsView } from './views/SalesRepsView';
import { TasksView } from './views/TasksView';
import { CrmAnalysisView } from './views/CrmAnalysisView';
import { LoginView } from './views/LoginView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('trueforecast_auth'));
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem('trueforecast_auth');
    if (!auth && location.pathname !== '/login') {
      setIsAuthenticated(false);
    }
  }, [location]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('trueforecast_auth');
    setIsAuthenticated(false);
    navigate('/login');
  };

  // If not authenticated, gate behind Admin Login page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginView onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#eee6da] text-[#1f1d1a] flex flex-col font-sans selection:bg-[#c86d51] selection:text-white">
      {/* Top Header Navigation */}
      <TopHeader onLogout={handleLogout} />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/pipeline" element={<PipelineView />} />
          <Route path="/forecast" element={<ForecastView />} />
          <Route path="/customers" element={<CustomersView />} />
          <Route path="/customers/:id" element={<CustomerProfileView />} />
          <Route path="/sales-reps" element={<SalesRepsView />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/crm-analysis" element={<CrmAnalysisView />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Clean Minimalist Full-Width Footer */}
      <Footer />
    </div>
  );
}
