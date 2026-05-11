import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import toast from 'react-hot-toast';

const CITIZEN_NAV = [
  { icon: '⊞', label: 'Dashboard', to: '/dashboard' },
  { icon: '📚', label: 'Learn', to: '/learn' },
  { icon: '🏛️', label: 'Gov Services', to: '/services' },
  { icon: '💼', label: 'Jobs', to: '/jobs' },
  { icon: '🚀', label: 'Startups', to: '/startups' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
];

const OFFICIAL_NAV = [
  { icon: '⊞', label: 'Overview', to: '/dashboard' },
  { icon: '📋', label: 'Applications', to: '/services' },
  { icon: '🚀', label: 'Startups', to: '/startups' },
  { icon: '💰', label: 'Grants', to: '/startups#grants' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
];

export default function DashboardLayout({ children, title, subtitle }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isOfficial = user?.role === 'government_official' || user?.role === 'admin';
  const navItems = isOfficial ? OFFICIAL_NAV : CITIZEN_NAV;
  const isActive = (to) => location.pathname === to;

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate('/');
  };

  const SIDEBAR_W = collapsed ? '64px' : '220px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: 'linear-gradient(180deg, var(--blue-900) 0%, var(--blue-800) 100%)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.125rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '8px', background: 'linear-gradient(135deg, #C8102E 0%, #1A3A6B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🇱🇷</div>
            {!collapsed && <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.01em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Future<span style={{ color: 'var(--gold-400)' }}>Lib</span></span>}
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={`sidebar-link ${isActive(item.to) ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ fontSize: '1.0625rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 0.625rem' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.5rem' }}>
              <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--gold-500) 0%, var(--red-600) 100%)', flexShrink: 0 }}>
                {user?.full_name?.[0] || 'U'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button className="sidebar-link" onClick={handleLogout} style={{ justifyContent: collapsed ? 'center' : 'flex-start', color: 'rgba(255,100,100,0.7)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff8888'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,100,100,0.7)'}
          >
            <span>🚪</span>{!collapsed && <span>Sign Out</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="sidebar-link" style={{ justifyContent: collapsed ? 'center' : 'flex-start', marginTop: '0.25rem' }}>
            <span>{collapsed ? '→' : '←'}</span>{!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '0 1.5rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div>
            {title && <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)' }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/ai" style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.375rem 0.875rem', borderRadius: '20px',
              background: 'var(--gold-100)', color: 'var(--gold-600)',
              fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
              border: '1px solid #fde68a',
            }}>✨ AI Help</Link>
            <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%)', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}>
              {user?.full_name?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '1.75rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
