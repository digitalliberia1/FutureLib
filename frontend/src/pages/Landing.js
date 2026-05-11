import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ── animated counter ── */
function AnimatedNumber({ target, suffix = '', prefix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(target / 50);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setVal(start);
        if (start >= target) clearInterval(timer);
      }, 25);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

const MODULES = [
  {
    id: 'learn', icon: '📚', color: 'var(--blue-700)', bg: 'var(--blue-50)', label: 'Learning Platform',
    title: 'Master Digital Skills',
    desc: 'Government-certified courses in Programming, AI, Cybersecurity, Entrepreneurship, and 10+ more categories. Earn national certificates.',
    to: '/learn',
    features: ['200+ courses', 'National certificates', 'Free for citizens', 'AI tutors'],
  },
  {
    id: 'startups', icon: '🚀', color: 'var(--red-600)', bg: 'var(--red-50)', label: 'Startup Ecosystem',
    title: 'Launch & Grow',
    desc: 'Register your startup, secure government funding, pitch to investors, and access Liberia\'s national innovation hub.',
    to: '/startups',
    features: ['Startup registration', 'Grants & loans', 'Investor matching', 'Pitch competitions'],
  },
  {
    id: 'services', icon: '🏛️', color: 'var(--purple-600)', bg: 'var(--purple-100)', label: 'Government Portal',
    title: 'Services Online',
    desc: 'Apply for licenses, permits, IDs, tax services, and 50+ more government services — all digitally, from anywhere in Liberia.',
    to: '/services',
    features: ['50+ services', 'Track applications', 'Digital documents', 'Real-time updates'],
  },
  {
    id: 'jobs', icon: '💼', color: 'var(--green-600)', bg: 'var(--green-50)', label: 'Job Marketplace',
    title: 'Find Opportunity',
    desc: 'AI-powered matching connects skilled Liberians with local, government, and remote opportunities across all sectors.',
    to: '/jobs',
    features: ['AI job matching', 'Government jobs', 'Remote positions', 'Skills verification'],
  },
];

const STATS = [
  { value: 15, suffix: '', label: 'Counties Connected', icon: '📍' },
  { value: 50, suffix: '+', label: 'Gov. Services', icon: '🏛️' },
  { value: 200, suffix: '+', label: 'Courses', icon: '📚' },
  { value: 10000, suffix: '+', label: 'Citizens Registered', icon: '👥' },
];

const TESTIMONIALS = [
  { name: 'Mary Kollie', role: 'Software Developer, Monrovia', county: 'Montserrado', text: 'FutureLib transformed my career. I took the web development course, earned my national certificate, and landed my first tech job — all within 8 months.', avatar: 'M' },
  { name: 'James Togba', role: 'Founder, AgriConnect LR', county: 'Nimba', text: 'We registered our AgriTech startup through FutureLib, received a government grant, and now we serve 500+ farmers across Nimba county.', avatar: 'J' },
  { name: 'Grace Kpoh', role: 'Youth Coordinator', county: 'Bong', text: 'The government services portal saved our youth group weeks of paperwork. We got our organization license approved in just 5 working days.', avatar: 'G' },
];

const PARTNERS = [
  'Min. of Education', 'Min. of Youth & Sports', 'Min. of Commerce',
  'National Investment Commission', 'Telecom Authority', 'Revenue Authority',
  'Immigration Services', 'Employment Bureau',
];

export default function Landing() {
  const [activeModule, setActiveModule] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, #0d2545 40%, #1a1f35 70%, #1a0a10 100%)', color: '#fff', padding: '6rem 1.25rem 5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-10%', right: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(26,58,107,0.5) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(200,16,46,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '760px' }}>
            <div className="feature-pill" style={{ marginBottom: '1.75rem', display: 'inline-flex' }}>
              <span>🇱🇷</span> Official National Digital Platform — Republic of Liberia
            </div>

            <h1 className="heading-display heading-1" style={{ color: '#fff', marginBottom: '1.375rem', lineHeight: 1.08 }}>
              Building Liberia's
              <span style={{ display: 'block', background: 'linear-gradient(90deg, var(--gold-400) 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Digital Future
              </span>
              Together
            </h1>

            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '580px' }}>
              Learn. Innovate. Connect. Thrive. One platform for citizens, youth, startups, educators, and government agencies across all 15 counties.
            </p>

            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
              <Link to="/register" className="btn btn-xl btn-accent">
                Create Free Account →
              </Link>
              <Link to="/learn" className="btn btn-xl btn-white-outline">
                Explore Courses
              </Link>
            </div>

            {/* Trust signals */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {['✓ 100% Free to join', '✓ Government certified', '✓ All 15 counties'].map((t) => (
                <span key={t} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Floating module cards */}
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }} className="hide-mobile">
            {MODULES.map((m, i) => (
              <div key={m.id} onClick={() => setActiveModule(i)} style={{
                background: activeModule === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${activeModule === i ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px', padding: '0.75rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                transform: activeModule === i ? 'translateX(-8px)' : 'none',
              }}>
                <span style={{ fontSize: '1.375rem' }}>{m.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{m.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{m.features[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--blue-800)', padding: '2.5rem 1.25rem' }}>
        <div className="container">
          <div className="grid-4">
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{s.icon}</div>
                <div style={{ fontSize: '2.375rem', fontWeight: 900, color: 'var(--gold-400)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', marginTop: '0.25rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow">Platform Modules</div>
            <h2 className="heading-display heading-2" style={{ marginBottom: '1rem' }}>Everything in One Place</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '1.125rem', maxWidth: '560px', margin: '0 auto' }}>
              A unified national ecosystem covering every aspect of Liberia's digital future
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {MODULES.map((m, i) => (
              <Link key={m.id} to={m.to} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{ height: '100%', borderTop: `3px solid ${m.color}` }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.125rem' }}>
                      <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '12px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.625rem', flexShrink: 0 }}>
                        {m.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: m.color, marginBottom: '0.25rem' }}>{m.label}</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)' }}>{m.title}</h3>
                      </div>
                    </div>
                    <p style={{ color: 'var(--gray-500)', lineHeight: 1.7, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>{m.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {m.features.map((f) => (
                        <span key={f} style={{ background: m.bg, color: m.color, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '20px' }}>✓ {f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ color: m.color, fontWeight: 700, fontSize: '0.875rem' }}>Explore {m.label} →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHASE 2 CALLOUT ── */}
      <section style={{ background: 'var(--color-bg)', padding: '4rem 1.25rem' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%)', borderRadius: '1.5rem', padding: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'radial-gradient(circle at right, rgba(200,16,46,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '20px', padding: '0.25rem 0.875rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gold-400)', marginBottom: '1rem' }}>
                🆕 Phase 2 — Now Live
              </div>
              <h2 style={{ color: '#fff', fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.75rem' }}>New: AI Assistant + Analytics</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: '480px' }}>
                Chat with FutureLib AI for personalized guidance. Explore national economic dashboards. Connect startups with investors.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <Link to="/ai" className="btn btn-accent btn-lg">✨ Try AI Assistant</Link>
              <Link to="/analytics" className="btn btn-white-outline btn-lg">📊 View Analytics</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-eyebrow">Success Stories</div>
            <h2 className="heading-display heading-2">Real Liberians, Real Impact</h2>
          </div>
          <div className="grid-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card" style={{ padding: '0' }}>
                <div className="card-body">
                  <div style={{ fontSize: '1.5rem', color: 'var(--gold-400)', marginBottom: '1rem' }}>❝</div>
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.75, marginBottom: '1.5rem', fontSize: '0.9375rem' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                    <div className="avatar avatar-md" style={{ background: `linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%)`, flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{t.role}</div>
                    </div>
                    <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{t.county}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow">Getting Started</div>
            <h2 className="heading-display heading-2">Up and Running in Minutes</h2>
          </div>
          <div className="grid-3">
            {[
              { num: '1', title: 'Create Account', desc: 'Register in under 2 minutes. Select your role — Citizen, Founder, Educator, or Official — and verify your email.', icon: '👤' },
              { num: '2', title: 'Explore Platform', desc: 'Access learning, government services, job listings, startup resources, and the AI assistant from one dashboard.', icon: '🗺️' },
              { num: '3', title: 'Build Your Future', desc: 'Earn certificates, apply for grants, find jobs, register startups, and shape Liberia\'s digital transformation.', icon: '🌟' },
            ].map((step) => (
              <div key={step.num} style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', border: '1px solid var(--gray-200)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-0.5rem', right: '1rem', fontSize: '4rem', fontWeight: 900, color: 'var(--blue-50)', lineHeight: 1, userSelect: 'none' }}>{step.num}</div>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{step.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.625rem', color: 'var(--gray-900)' }}>{step.title}</h3>
                <p style={{ color: 'var(--gray-500)', lineHeight: 1.7, fontSize: '0.9375rem' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section style={{ background: '#fff', padding: '3rem 1.25rem', borderTop: '1px solid var(--gray-200)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.75rem' }}>
            Integrated Government Partners
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', justifyContent: 'center' }}>
            {PARTNERS.map((p) => (
              <span key={p} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '20px', padding: '0.375rem 1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-600)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 50%, var(--red-700) 100%)', padding: '5rem 1.25rem', textAlign: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="heading-display" style={{ fontSize: '2.75rem', color: '#fff', marginBottom: '1.125rem' }}>
            Ready to Build<br />Your Future?
          </h2>
          <p style={{ fontSize: '1.25rem', opacity: 0.85, marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
            Join thousands of Liberians already using FutureLib to learn, work, and build a better tomorrow.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-xl btn-accent">Create Free Account →</Link>
            <Link to="/learn" className="btn btn-xl btn-white-outline">Browse Courses</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
