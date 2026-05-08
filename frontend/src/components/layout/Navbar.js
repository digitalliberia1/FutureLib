import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  const roleLabel = (role) => ({
    citizen: 'Citizen',
    government_official: 'Gov. Official',
    startup_founder: 'Founder',
    investor: 'Investor',
    educator: 'Educator',
    admin: 'Admin',
  }[role] || role);

  return (
    <nav style={{
      background: 'var(--color-primary)',
      color: '#fff',
      boxShadow: 'var(--shadow)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '1.5rem' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 800, fontSize: '1.25rem', textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: '1.5rem' }}>🇱🇷</span>
          <span>FutureLib</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }} className="desktop-nav">
          <NavLink to="/learn">Learn</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/startups">Startups</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  padding: '0.375rem 0.75rem', borderRadius: '9999px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                <span style={{
                  width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '0.875rem',
                }}>
                  {user?.full_name?.[0] || 'U'}
                </span>
                <span style={{ fontSize: '0.875rem' }}>{user?.full_name?.split(' ')[0] || 'User'}</span>
              </button>
              {profileOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
                  background: '#fff', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                  minWidth: '200px', color: 'var(--color-text)', zIndex: 200,
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 700 }}>{user?.full_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{roleLabel(user?.role)}</div>
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    <DropdownItem onClick={() => { navigate('/dashboard'); setProfileOpen(false); }}>Dashboard</DropdownItem>
                    <DropdownItem onClick={handleLogout} danger>Sign Out</DropdownItem>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Log In</Link>
              <Link to="/register" className="btn btn-sm" style={{ background: 'var(--color-accent)', color: '#000' }}>Register</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .desktop-nav a { color: rgba(255,255,255,0.85); padding: 0.375rem 0.75rem; border-radius: 6px; text-decoration: none; font-size: 0.9375rem; font-weight: 500; transition: background 0.15s; }
        .desktop-nav a:hover { background: rgba(255,255,255,0.15); color: #fff; text-decoration: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </nav>
  );
}

function NavLink({ to, children }) {
  return <Link to={to}>{children}</Link>;
}

function DropdownItem({ onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '0.5rem 0.75rem',
        background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
        borderRadius: '4px', fontSize: '0.875rem', color: danger ? 'var(--color-error)' : 'var(--color-text)',
      }}
      onMouseEnter={(e) => e.target.style.background = danger ? '#fee2e2' : 'var(--color-bg)'}
      onMouseLeave={(e) => e.target.style.background = 'none'}
    >
      {children}
    </button>
  );
}
