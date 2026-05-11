import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SECTORS = ['All', 'AgriTech', 'EdTech', 'FinTech', 'HealthTech', 'CleanTech', 'E-commerce', 'Logistics', 'GovTech', 'Other'];
const STAGES = ['All', 'idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'scale'];

const STAGE_BADGE = {
  idea: ['badge-gray', '💡'],
  prototype: ['badge-blue', '🔨'],
  mvp: ['badge-purple', '🚀'],
  early_revenue: ['badge-yellow', '💵'],
  growth: ['badge-green', '📈'],
  scale: ['badge-green', '🌍'],
};

const SECTOR_COLORS = {
  AgriTech: 'var(--green-600)', EdTech: 'var(--blue-700)', FinTech: 'var(--gold-500)',
  HealthTech: 'var(--red-600)', CleanTech: 'var(--green-500)', 'E-commerce': 'var(--purple-600)',
  Logistics: 'var(--blue-500)', GovTech: 'var(--blue-800)', Other: 'var(--gray-500)',
};

export default function StartupHub() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [startups, setStartups] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [tab, setTab] = useState('startups');
  const [registerModal, setRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', sector: 'AgriTech', stage: 'idea', tagline: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/startups/', { params: { sector: sector || undefined, stage: stage || undefined } }).catch(() => ({ data: { startups: [] } })),
      api.get('/startups/grants/list').catch(() => ({ data: { grants: [] } })),
    ]).then(([sRes, gRes]) => {
      setStartups(sRes.data.startups || []);
      setGrants(gRes.data.grants || []);
      setLoading(false);
    });
  }, [sector, stage]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please log in first'); return; }
    setRegistering(true);
    try {
      await api.post('/startups/', form);
      toast.success('Startup registered! Pending government review. 🚀');
      setRegisterModal(false);
      setForm({ name: '', description: '', sector: 'AgriTech', stage: 'idea', tagline: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, var(--red-700) 50%, var(--red-600) 100%)', color: '#fff', padding: '3.5rem 1.25rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 75% 50%, rgba(245,158,11,0.15) 0%, transparent 55%), radial-gradient(circle at 25% 70%, rgba(26,58,107,0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>Liberia Innovation Ecosystem</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }}>
            <div>
              <h1 className="heading-display" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.875rem' }}>Startup Hub</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', maxWidth: '540px', marginBottom: '1.75rem' }}>
                Register your startup, access funding, connect with investors, and grow in Liberia's national innovation ecosystem.
              </p>
              <button
                className="btn btn-lg"
                style={{ background: 'var(--gold-400)', color: '#000', fontWeight: 800, marginBottom: '2rem' }}
                onClick={() => setRegisterModal(true)}
              >
                🚀 Register Your Startup
              </button>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', paddingRight: '1rem' }}>
              {[[startups.length || '0', 'Startups'], [grants.length || '0', 'Open Grants'], ['🌍', 'Pan-Africa']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--gold-400)', fontWeight: 900, fontSize: '1.75rem', lineHeight: 1 }}>{v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            {['startups', 'grants'].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '0.875rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9375rem',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                borderBottom: tab === t ? '3px solid var(--gold-400)' : '3px solid transparent',
              }}>
                {t === 'startups' ? '🚀 Startups' : '💰 Grants & Funding'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem', flex: 1 }}>
        {tab === 'startups' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-500)' }}>Sector:</span>
                  {SECTORS.slice(0, 5).map(s => (
                    <button key={s} onClick={() => setSector(s === 'All' ? '' : s)} className={`chip${sector === (s === 'All' ? '' : s) ? ' active' : ''}`}>{s}</button>
                  ))}
                </div>
              </div>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }}
                value={stage}
                onChange={(e) => setStage(e.target.value === 'All' ? '' : e.target.value)}
              >
                {STAGES.map((s) => <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
              </select>
              <span style={{ color: 'var(--gray-400)', fontSize: '0.875rem', fontWeight: 600 }}>{startups.length} startup{startups.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card card-body">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                      <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: '12px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}><div className="skeleton" style={{ height: '14px', marginBottom: '0.375rem' }} /><div className="skeleton" style={{ height: '12px', width: '60%' }} /></div>
                    </div>
                    <div className="skeleton" style={{ height: '13px', marginBottom: '0.25rem' }} />
                    <div className="skeleton" style={{ height: '13px', width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : startups.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <div className="empty-title">No startups yet</div>
                <div className="empty-desc">Be the first to register a startup in Liberia's innovation ecosystem</div>
                <button className="btn btn-primary btn-sm" onClick={() => setRegisterModal(true)}>Register Your Startup</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {startups.map((startup) => {
                  const [stageCls, stageIcon] = STAGE_BADGE[startup.stage] || ['badge-gray', '•'];
                  const sectorColor = SECTOR_COLORS[startup.sector] || 'var(--blue-700)';
                  return (
                    <div key={startup.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="card-body" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{
                            width: '3rem', height: '3rem', borderRadius: '12px', flexShrink: 0,
                            background: `linear-gradient(135deg, ${sectorColor}, ${sectorColor}cc)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 900, fontSize: '1.375rem',
                          }}>
                            {startup.name[0]}
                          </div>
                          <span className={`badge ${stageCls}`}>{stageIcon} {startup.stage.replace('_', ' ')}</span>
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>{startup.name}</h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.875rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {startup.tagline || startup.description}
                        </p>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{startup.sector}</span>
                          {startup.is_hiring && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Hiring</span>}
                          {startup.government_verified && <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>✓ Verified</span>}
                        </div>
                      </div>
                      <div className="card-footer" style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>👤 {startup.founder_name}</span>
                        <span>{startup.employee_count} employee{startup.employee_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'grants' && (
          <div style={{ paddingTop: '1rem' }}>
            {grants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <div className="empty-title">No grants available</div>
                <div className="empty-desc">Check back soon for new funding opportunities</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {grants.map((grant) => (
                  <div key={grant.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--green-600), var(--green-400))', borderRadius: '12px 12px 0 0' }} />
                    <div className="card-body" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                        <span className="badge badge-green">Open</span>
                        <span className="badge badge-blue">{grant.grant_type}</span>
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gray-900)', lineHeight: 1.4 }}>{grant.title}</h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '1rem', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {grant.description}
                      </p>
                      <div style={{ background: 'var(--green-50)', borderRadius: '8px', padding: '0.625rem 0.875rem', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 600, marginBottom: '0.25rem' }}>FUNDING RANGE</div>
                        <div style={{ fontWeight: 900, fontSize: '1.125rem', color: 'var(--green-700)' }}>
                          {grant.currency} {grant.amount_min?.toLocaleString()} – {grant.amount_max?.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>🏛️ {grant.ministry}</div>
                    </div>
                    <div className="card-footer">
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => { if (!isAuthenticated) toast.error('Please log in to apply'); else toast.success('Redirecting to application form...'); }}
                      >
                        Apply for Grant →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Modal */}
      {registerModal && (
        <div className="modal-overlay" onClick={() => setRegisterModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Innovation Ecosystem</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Register Your Startup 🚀</h2>
              </div>
              <button onClick={() => setRegisterModal(false)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)' }}>×</button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label form-label-req">Startup Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. AgriConnect LR" />
                </div>
                <div>
                  <label className="form-label">Tagline</label>
                  <input className="form-input" value={form.tagline} onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="One-line description of your startup" />
                </div>
                <div>
                  <label className="form-label form-label-req">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="What problem does your startup solve?" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label form-label-req">Sector</label>
                    <select className="form-input" value={form.sector} onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))}>
                      {SECTORS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label form-label-req">Stage</label>
                    <select className="form-input" value={form.stage} onChange={(e) => setForm(f => ({ ...f, stage: e.target.value }))}>
                      {STAGES.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ background: 'var(--gold-100)', borderRadius: '10px', padding: '0.875rem', border: '1px solid #fde68a', fontSize: '0.8125rem', color: 'var(--gold-700)' }}>
                  💡 Your startup will be reviewed by the Ministry of Commerce within 3-5 business days before appearing publicly.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setRegisterModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={registering} style={{ flex: 2, justifyContent: 'center' }}>
                  {registering ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Registering...</> : 'Register Startup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
