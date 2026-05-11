import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/authSlice';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import CitizenDashboard from './pages/dashboard/CitizenDashboard';
import OfficialDashboard from './pages/dashboard/OfficialDashboard';
import CourseList from './pages/learning/CourseList';
import CourseDetail from './pages/learning/CourseDetail';
import ServicesPortal from './pages/government/ServicesPortal';
import StartupHub from './pages/startups/StartupHub';
import JobMarketplace from './pages/jobs/JobMarketplace';
import Analytics from './pages/analytics/Analytics';
import AIAssistant from './pages/ai/AIAssistant';
import InvestorPortal from './pages/investor/InvestorPortal';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMe());
  }, [dispatch, isAuthenticated]);

  const dashboardRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'government_official' || user.role === 'admin') {
      return <OfficialDashboard />;
    }
    return <CitizenDashboard />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute>{dashboardRoute()}</ProtectedRoute>} />
        <Route path="/learn" element={<CourseList />} />
        <Route path="/learn/:courseId" element={<CourseDetail />} />
        <Route path="/services" element={<ServicesPortal />} />
        <Route path="/startups" element={<StartupHub />} />
        <Route path="/jobs" element={<JobMarketplace />} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/investors" element={<ProtectedRoute><InvestorPortal /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
