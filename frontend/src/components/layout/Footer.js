import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-primary)', color: 'rgba(255,255,255,0.85)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '3rem 1rem 1.5rem' }}>
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', marginBottom: '0.75rem' }}>
              🇱🇷 FutureLib
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
              National Digital Transformation Platform for Liberia. Building a connected, empowered nation.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Platform</div>
            {['Learn', 'Startups', 'Jobs', 'Services'].map(item => (
              <FooterLink key={item} to={`/${item.toLowerCase()}`}>{item}</FooterLink>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Government</div>
            {['Ministries', 'Policies', 'Data Portal', 'Transparency'].map(item => (
              <FooterLink key={item} to="#">{item}</FooterLink>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Support</div>
            {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map(item => (
              <FooterLink key={item} to="#">{item}</FooterLink>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <span>© 2025 FutureLib — Republic of Liberia</span>
          <span>Built with 🤍 for all Liberians</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <div style={{ marginBottom: '0.375rem' }}>
      <Link to={to} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textDecoration: 'none' }}
        onMouseEnter={(e) => e.target.style.color = '#fff'}
        onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
      >{children}</Link>
    </div>
  );
}
