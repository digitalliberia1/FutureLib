import React from 'react';
import { Link } from 'react-router-dom';

const LINKS = {
  Platform: [
    { label: 'Learn', to: '/learn' },
    { label: 'Startups', to: '/startups' },
    { label: 'Job Marketplace', to: '/jobs' },
    { label: 'Gov. Services', to: '/services' },
    { label: 'Analytics', to: '/analytics' },
    { label: 'AI Assistant', to: '/ai' },
  ],
  Government: [
    { label: 'Ministry of Education', to: '#' },
    { label: 'Ministry of Commerce', to: '#' },
    { label: 'National Investment Commission', to: '#' },
    { label: 'Data Portal', to: '#' },
    { label: 'Transparency', to: '#' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Contact Us', to: '#' },
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
    { label: 'Accessibility', to: '#' },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: 'var(--blue-900)', color: 'rgba(255,255,255,0.75)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '4rem 1.25rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.125rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '10px', background: 'linear-gradient(135deg, #C8102E 0%, #1A3A6B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>🇱🇷</div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Future<span style={{ color: 'var(--gold-400)' }}>Lib</span>
              </span>
            </div>
            <p style={{ lineHeight: 1.75, fontSize: '0.9rem', maxWidth: '280px', marginBottom: '1.5rem' }}>
              Liberia's national digital transformation platform — empowering citizens, businesses, and government through technology.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['🌐', '𝕏', '📘', '▶'].map((icon, i) => (
                <a key={i} href="#" style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >{icon}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{section}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item) => (
                  <Link key={item.label} to={item.to} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  >{item.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>
          <div>© 2025 FutureLib — Republic of Liberia · Ministry of Innovation & Technology</div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span>Built with 🤍 for all Liberians</span>
            <span>v2.0.0 · Phase 2</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
