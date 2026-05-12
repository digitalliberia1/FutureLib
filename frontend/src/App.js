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
import EducatorDashboard from './pages/dashboard/EducatorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

import CourseList from './pages/learning/CourseList';
import CourseDetail from './pages/learning/CourseDetail';
import CourseLearner from './pages/learn/CourseLearner';

import ServicesPortal from './pages/government/ServicesPortal';
import StartupHub from './pages/startups/StartupHub';
import JobMarketplace from './pages/jobs/JobMarketplace';
import Analytics from './pages/analytics/Analytics';
import AIAssistant from './pages/ai/AIAssistant';
import InvestorPortal from './pages/investor/InvestorPortal';

import UserProfile from './pages/profile/UserProfile';
import SearchPage from './pages/search/SearchPage';
import CommunityForum from './pages/community/CommunityForum';
import CertificatePage from './pages/certificates/CertificatePage';

import CybersecurityCenter from './pages/cybersecurity/CybersecurityCenter';
import InfrastructureMonitor from './pages/infrastructure/InfrastructureMonitor';
import SmartCities from './pages/smart-city/SmartCities';
import DigitalEconomy from './pages/digital-economy/DigitalEconomy';
import AIGovernance from './pages/ai-governance/AIGovernance';

import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMe());
  }, [dispatch, isAuthenticated]);

  const dashboardRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <AdminDashboard />;
    if (user.role === 'educator') return <EducatorDashboard />;
    if (user.role === 'government_official') return <OfficialDashboard />;
    return <CitizenDashboard />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/certificates/verify/:certId" element={<CertificatePage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Public browsing */}
        <Route path="/learn" element={<CourseList />} />
        <Route path="/learn/:courseId" element={<CourseDetail />} />
        <Route path="/services" element={<ServicesPortal />} />
        <Route path="/startups" element={<StartupHub />} />
        <Route path="/jobs" element={<JobMarketplace />} />

        {/* Protected — all authenticated users */}
        <Route path="/dashboard" element={<ProtectedRoute>{dashboardRoute()}</ProtectedRoute>} />
        <Route path="/learn/:courseId/play" element={<ProtectedRoute><CourseLearner /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityForum /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/investors" element={<ProtectedRoute><InvestorPortal /></ProtectedRoute>} />

        {/* Phase 3 — Advanced */}
        <Route path="/cybersecurity" element={<ProtectedRoute><CybersecurityCenter /></ProtectedRoute>} />
        <Route path="/infrastructure" element={<ProtectedRoute><InfrastructureMonitor /></ProtectedRoute>} />

        {/* Phase 4 — Smart Nation */}
        <Route path="/smart-cities" element={<ProtectedRoute><SmartCities /></ProtectedRoute>} />
        <Route path="/digital-economy" element={<ProtectedRoute><DigitalEconomy /></ProtectedRoute>} />
        <Route path="/ai-governance" element={<ProtectedRoute><AIGovernance /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
