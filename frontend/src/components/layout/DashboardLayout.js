import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CITIZEN_NAV = [
  { icon: '⊞', label: 'Dashboard', to: '/dashboard' },
  { icon: '📚', label: 'Learn', to: '/learn' },
  { icon: '🏛️', label: 'Gov Services', to: '/services' },
  { icon: '💼', label: 'Jobs', to: '/jobs' },
  { icon: '🚀', label: 'Startups', to: '/startups' },
  { icon: '💬', label: 'Community', to: '/community' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
  { icon: '🏙️', label: 'Smart Cities', to: '/smart-cities' },
  { icon: '💱', label: 'Digital Economy', to: '/digital-economy' },
  { icon: '👤', label: 'My Profile', to: '/profile' },
];

const OFFICIAL_NAV = [
  { icon: '⊞', label: 'Overview', to: '/dashboard' },
  { icon: '📋', label: 'Applications', to: '/services' },
  { icon: '🚀', label: 'Startups', to: '/startups' },
  { icon: '💰', label: 'Grants', to: '/startups#grants' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
  { icon: '🏙️', label: 'Smart Cities', to: '/smart-cities' },
  { icon: '💱', label: 'Digital Economy', to: '/digital-economy' },
  { icon: '🤖', label: 'AI Governance', to: '/ai-governance' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
  { icon: '👤', label: 'My Profile', to: '/profile' },
];

const EDUCATOR_NAV = [
  { icon: '⊞', label: 'Dashboard', to: '/dashboard' },
  { icon: '📚', label: 'My Courses', to: '/learn' },
  { icon: '💬', label: 'Community', to: '/community' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
  { icon: '👤', label: 'My Profile', to: '/profile' },
];

const ADMIN_NAV = [
  { icon: '⊞', label: 'Admin Panel', to: '/dashboard' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
  { icon: '📚', label: 'Courses', to: '/learn' },
  { icon: '🚀', label: 'Startups', to: '/startups' },
  { icon: '🔐', label: 'Cybersecurity', to: '/cybersecurity' },
  { icon: '🖥️', label: 'Infrastructure', to: '/infrastructure' },
  { icon: '🏙️', label: 'Smart Cities', to: '/smart-cities' },
  { icon: '💱', label: 'Digital Economy', to: '/digital-economy' },
  { icon: '🤖', label: 'AI Governance', to: '/ai-governance' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
];

const INVESTOR_NAV = [
  { icon: '⊞', label: 'Dashboard', to: '/dashboard' },
  { icon: '💼', label: 'Investor Portal', to: '/investors' },
  { icon: '🚀', label: 'Startups', to: '/startups' },
  { icon: '📊', label: 'Analytics', to: '/analytics' },
  { icon: '💱', label: 'Digital Economy', to: '/digital-economy' },
  { icon: '✨', label: 'AI Assistant', to: '/ai' },
  { icon: '👤', label: 'My Profile', to: '/profile' },
];

function getNav(role) {
  if (role === 'government_official') return OFFICIAL_NAV;
  if (role === 'admin') return ADMIN_NAV;
  if (role === 'educator') return EDUCATOR_NAV;
  if (role === 'investor') return INVESTOR_NAV;
  return CITIZEN_NAV;
}

export default function DashboardLayout({ children, title, subtitle }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPanel, setNotifPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoaded, setNotifsLoaded] = useState(false);
  const notifRef = useRef(null);

  const navItems = getNav(user?.role);
  const isActive = (to) => location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to.split('#')[0]));

  useEffect(() => {
    api.get('/notifications/unread-count').then(({ data }) => setUnreadCount(data.unread_count || 0)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then(({ data }) => setUnreadCount(data.unread_count || 0)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifPanel(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    if (!notifsLoaded) {
      const { data } = await api.get('/notifications/', { params: { page_size: 8 } }).catch(() => ({ data: { notifications: [] } }));
      setNotifications(data.notifications || []);
      setNotifsLoaded(true);
    }
    setNotifPanel(v => !v);
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/mark-all-read').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate('/');
  };

  const SIDEBAR_W = collapsed ? '64px' : '220px';

  const NOTIF_ICONS = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
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

        {/* Search shortcut */}
        {!collapsed && (
          <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Link to="/search" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.5rem 0.75rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            >
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>🔍</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8125rem' }}>Search...</span>
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link key={`${item.to}-${item.label}`} to={item.to} className={`sidebar-link ${isActive(item.to) ? 'active' : ''}`}
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
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
          )}
          <button className="sidebar-link" onClick={handleLogout}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', color: 'rgba(255,100,100,0.7)', border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ff8888'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,100,100,0.7)'}
          >
            <span>🚪</span>{!collapsed && <span>Sign Out</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="sidebar-link"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', marginTop: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
          >
            <span>{collapsed ? '→' : '←'}</span>{!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '0 1.5rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            {title && <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <Link to="/ai" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', borderRadius: '20px', background: 'var(--gold-100)', color: 'var(--gold-600)', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #fde68a' }}>✨ AI Help</Link>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={loadNotifications} style={{ position: 'relative', width: '2.25rem', height: '2.25rem', borderRadius: '10px', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.0625rem', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-50)'; e.currentTarget.style.borderColor = 'var(--blue-300)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '1.125rem', height: '1.125rem', borderRadius: '50%', background: 'var(--red-600)', color: '#fff', fontSize: '0.625rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifPanel && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '360px', background: '#fff', borderRadius: '14px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-200)', zIndex: 200, animation: 'slideDown 0.15s ease both' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.125rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>Notifications {unreadCount > 0 && <span style={{ background: 'var(--red-600)', color: '#fff', borderRadius: '9999px', fontSize: '0.7rem', padding: '0.125rem 0.5rem', marginLeft: '0.375rem' }}>{unreadCount}</span>}</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--blue-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                        <div style={{ fontSize: '0.875rem' }}>No notifications yet</div>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => markRead(n.id)} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--gray-50)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'var(--blue-50)', transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (n.is_read) e.currentTarget.style.background = 'var(--gray-50)'; }}
                          onMouseLeave={e => { if (n.is_read) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{NOTIF_ICONS[n.notification_type] || 'ℹ️'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: n.is_read ? 600 : 800, fontSize: '0.8125rem', color: 'var(--gray-900)', marginBottom: '0.125rem' }}>{n.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                          {!n.is_read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--blue-600)', flexShrink: 0, marginTop: '0.375rem' }} />}
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ padding: '0.75rem', borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
                    <Link to="/profile" onClick={() => setNotifPanel(false)} style={{ fontSize: '0.8125rem', color: 'var(--blue-600)', fontWeight: 600, textDecoration: 'none' }}>View all notifications →</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="avatar avatar-md" style={{ background: 'linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%)', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              {user?.avatar_url ? <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (user?.full_name?.[0] || 'U')}
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
