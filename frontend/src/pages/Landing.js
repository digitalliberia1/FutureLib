import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const MODULES = [
  { icon: '📚', title: 'Digital Learning', desc: 'Government-certified courses in programming, AI, cybersecurity, entrepreneurship, and more.', link: '/learn', color: '#003580' },
  { icon: '🚀', title: 'Startup Ecosystem', desc: 'Register your startup, apply for grants, connect with investors, and pitch your ideas.', link: '/startups', color: '#c8102e' },
  { icon: '🏛️', title: 'Government Services', desc: 'Apply for licenses, permits, IDs, and more — directly from your phone or computer.', link: '/services', color: '#003580' },
  { icon: '💼', title: 'Job Marketplace', desc: 'AI-powered matching to connect skilled Liberians with local and remote opportunities.', link: '/jobs', color: '#c8102e' },
  { icon: '💰', title: 'Funding & Grants', desc: 'Access government grants, youth empowerment funds, and SME financing programs.', link: '/startups', color: '#003580' },
  { icon: '🛡️', title: 'Cybersecurity', desc: 'National cybersecurity coordination, threat monitoring, and citizen digital safety.', link: '#', color: '#c8102e' },
];

const STATS = [
  { value: '15', label: 'Counties Connected' },
  { value: '50+', label: 'Government Services' },
  { value: '200+', label: 'Courses Available' },
  { value: '10K+', label: 'Citizens Registered' },
];

const STEPS = [
  { num: '1', title: 'Create Account', desc: 'Register as a Citizen, Founder, Educator, or Official in minutes.' },
  { num: '2', title: 'Explore Platform', desc: 'Access learning, government services, job listings, and startup resources.' },
  { num: '3', title: 'Build Your Future', desc: 'Earn certificates, apply for grants, find jobs, and connect with Liberia.' },
];

const PARTNERS = [
  'Ministry of Education', 'Ministry of Youth & Sports', 'Ministry of Commerce',
  'Ministry of Finance', 'National Investment Commission', 'Telecommunications Authority',
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #1a4fa0 60%, var(--color-secondary) 100%)',
        color: '#fff', padding: '5rem 1rem 4rem', textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '9999px', padding: '0.375rem 1rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            🇱🇷 National Digital Platform — Republic of Liberia
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.25rem', maxWidth: '800px', margin: '0 auto 1.25rem' }}>
            Building Liberia's<br />Digital Future — Together
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Learn. Innovate. Connect. Thrive. FutureLib is the national platform for citizens, youth, startups, educators, and government agencies.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-lg" style={{ background: 'var(--color-accent)', color: '#000' }}>
              Get Started — It's Free
            </Link>
            <Link to="/learn" className="btn btn-lg btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--color-primary-dark, #002560)', color: '#fff', padding: '2rem 1rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-accent)' }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Everything You Need</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>A unified national ecosystem covering all aspects of digital life in Liberia</p>
          <div className="grid-3">
            {MODULES.map((m) => (
              <Link key={m.title} to={m.link} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div className="card-body">
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                      {m.icon}
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>{m.title}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{m.desc}</p>
                  </div>
                  <div className="card-footer" style={{ borderTop: `3px solid ${m.color}` }}>
                    <span style={{ color: m.color, fontWeight: 700, fontSize: '0.875rem' }}>Explore →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>How It Works</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>Get started in 3 simple steps</p>
          <div className="grid-3">
            {STEPS.map((step) => (
              <div key={step.num} style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{
                  width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--color-primary)',
                  color: '#fff', fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 1.25rem',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="section-sm" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Government Partners</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {PARTNERS.map((p) => (
              <span key={p} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '9999px', padding: '0.375rem 1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', color: '#fff', padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem' }}>Ready to Build Your Future?</h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '2rem' }}>Join thousands of Liberians already on FutureLib</p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'var(--color-accent)', color: '#000' }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
