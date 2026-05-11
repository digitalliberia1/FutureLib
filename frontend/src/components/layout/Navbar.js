import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  {
    label: 'Learn',
    to: '/learn',
    sub: [
      { label: 'Browse Courses', to: '/learn', desc: '200+ government-certified courses' },
      { label: 'My Courses', to: '/dashboard', desc: 'Continue where you left off' },
      { label: 'Certifications', to: '/learn', desc: 'Earn national digital certificates' },
    ],
  },
  {
    label: 'Startups',
    to: '/startups',
    sub: [
      { label: 'Startup Hub', to: '/startups', desc: 'Discover Liberian startups' },
      { label: 'Grants & Funding', to: '/startups#grants', desc: 'Government funding programs' },
      { label: 'Investor Portal', to: '/investors', desc: 'Connect with investors' },
    ],
  },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Services', to: '/services' },
  { label: 'Analytics', to: '/analytics' },
];

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveDropdown(null);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out successfully');
    navigate('/');
  };

  const isActive = (to) => location.pathname.startsWith(to) && to !== '/';
  const roleBadge = { citizen: 'Citizen', government_official: 'Gov. Official', startup_founder: 'Founder', investor: 'Investor', educator: 'Educator', admin: 'Admin' };

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: scrolled ? 'rgba(10,22,40,0.97)' : 'var(--blue-900)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '60px', gap: '0.5rem' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0, marginRight: '0.5rem' }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #C8102E 0%, #1A3A6B 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 900, color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>🇱🇷</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.01em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Future<span style={{ color: 'var(--gold-400)' }}>Lib</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1 }}>
            {NAV_ITEMS.map((item) => (
              <div key={item.label} style={{ position: 'relative' }}>
                {item.sub ? (
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.4rem 0.75rem', border: 'none', background: 'none', cursor: 'pointer',
                      color: isActive(item.to) ? '#fff' : 'rgba(255,255,255,0.75)',
                      fontWeight: isActive(item.to) ? 700 : 500,
                      fontSize: '0.9rem', borderRadius: '6px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {item.label}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.7, transform: activeDropdown === item.label ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    style={{
                      display: 'block', padding: '0.4rem 0.75rem', borderRadius: '6px',
                      color: isActive(item.to) ? '#fff' : 'rgba(255,255,255,0.75)',
                      fontWeight: isActive(item.to) ? 700 : 500,
                      fontSize: '0.9rem', transition: 'all 0.15s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Dropdown */}
                {item.sub && activeDropdown === item.label && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: '-0.5rem',
                    background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)', padding: '0.5rem',
                    minWidth: '240px', animation: 'slideDown 0.15s ease',
                    zIndex: 300,
                  }}>
                    {item.sub.map((sub) => (
                      <Link key={sub.label} to={sub.to} style={{ display: 'block', padding: '0.625rem 0.875rem', borderRadius: '8px', textDecoration: 'none', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{sub.label}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{sub.desc}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Chat quick button */}
          <Link to="/ai" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.35rem 0.875rem', borderRadius: '20px',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            color: 'var(--gold-400)', fontSize: '0.8125rem', fontWeight: 700,
            textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; }}
          >
            ✨ AI
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <div ref={profileRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', padding: '0.35rem 0.625rem 0.35rem 0.375rem',
                  borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <div className="avatar avatar-sm" style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg, var(--gold-500) 0%, var(--red-600) 100%)' }}>
                  {user?.full_name?.[0] || 'U'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name?.split(' ')[0]}
                </span>
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)', minWidth: '220px',
                  animation: 'slideDown 0.15s ease', zIndex: 300, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.875rem 1rem', background: 'linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%)', color: '#fff' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{user?.full_name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '0.125rem' }}>{roleBadge[user?.role] || user?.role}</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.125rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                        ⭐ {user?.points || 0} pts
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    {[
                      { label: '🏠 Dashboard', to: '/dashboard' },
                      { label: '📚 My Courses', to: '/dashboard' },
                      { label: '💰 Billing', to: '/billing' },
                    ].map((item) => (
                      <button key={item.label} onClick={() => { navigate(item.to); setProfileOpen(false); }} style={{
                        display: 'flex', width: '100%', padding: '0.5rem 0.75rem', border: 'none',
                        background: 'none', cursor: 'pointer', borderRadius: '6px',
                        fontSize: '0.875rem', color: 'var(--gray-700)', fontWeight: 500, textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >{item.label}</button>
                    ))}
                    <div style={{ borderTop: '1px solid var(--gray-100)', margin: '0.375rem 0' }} />
                    <button onClick={handleLogout} style={{
                      display: 'flex', width: '100%', padding: '0.5rem 0.75rem', border: 'none',
                      background: 'none', cursor: 'pointer', borderRadius: '6px',
                      fontSize: '0.875rem', color: 'var(--red-600)', fontWeight: 600, textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >🚪 Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Sign In</Link>
              <Link to="/register" className="btn btn-sm" style={{ background: 'var(--gold-400)', color: '#000', fontWeight: 700 }}>Get Started</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Active page indicator bar */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--blue-700) 0%, var(--red-600) 50%, var(--gold-400) 100%)', opacity: 0.8 }} />
    </>
  );
}
