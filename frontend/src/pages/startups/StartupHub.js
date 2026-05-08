import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SECTORS = ['All', 'AgriTech', 'EdTech', 'FinTech', 'HealthTech', 'CleanTech', 'E-commerce', 'Logistics', 'GovTech', 'Other'];
const STAGES = ['All', 'idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'scale'];

const STAGE_COLORS = {
  idea: 'badge-gray', prototype: 'badge-blue', mvp: 'badge-purple',
  early_revenue: 'badge-yellow', growth: 'badge-green', scale: 'badge-green',
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ background: 'linear-gradient(135deg, var(--color-secondary) 0%, #a30d24 100%)', color: '#fff', padding: '3rem 1rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>Startup Ecosystem</h1>
        <p style={{ opacity: 0.9, fontSize: '1.125rem', maxWidth: '550px', margin: '0 auto 1.5rem' }}>
          Register your startup, access funding, connect with investors, and grow in Liberia's innovation ecosystem.
        </p>
        <button className="btn btn-lg" style={{ background: 'var(--color-accent)', color: '#000' }} onClick={() => setRegisterModal(true)}>
          + Register Your Startup
        </button>
      </div>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
          {['startups', 'grants'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9375rem',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
            }}>
              {t === 'startups' ? '🚀 Startups' : '💰 Grants & Funding'}
            </button>
          ))}
        </div>

        {tab === 'startups' && (
          <>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem' }} value={sector} onChange={(e) => setSector(e.target.value === 'All' ? '' : e.target.value)}>
                {SECTORS.map((s) => <option key={s} value={s === 'All' ? '' : s}>{s}</option>)}
              </select>
              <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem' }} value={stage} onChange={(e) => setStage(e.target.value === 'All' ? '' : e.target.value)}>
                {STAGES.map((s) => <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>{startups.length} startup{startups.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading...</div>
            ) : startups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No startups yet. Be the first!</p>
                <button className="btn btn-primary" onClick={() => setRegisterModal(true)}>Register Startup</button>
              </div>
            ) : (
              <div className="grid-3">
                {startups.map((startup) => (
                  <div key={startup.id} className="card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                  >
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-secondary) 0%, #a30d24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.25rem' }}>
                          {startup.name[0]}
                        </div>
                        <span className={`badge ${STAGE_COLORS[startup.stage] || 'badge-gray'}`}>{startup.stage}</span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{startup.name}</h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{startup.tagline || startup.description?.slice(0, 80)}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-blue">{startup.sector}</span>
                        {startup.is_hiring && <span className="badge badge-green">Hiring</span>}
                        {startup.government_verified && <span className="badge badge-purple">✓ Verified</span>}
                      </div>
                    </div>
                    <div className="card-footer" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      👤 {startup.founder_name} · {startup.employee_count} employee{startup.employee_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'grants' && (
          <div>
            {grants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                <p>No grants available right now. Check back soon!</p>
              </div>
            ) : (
              <div className="grid-3">
                {grants.map((grant) => (
                  <div key={grant.id} className="card">
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span className="badge badge-green">Open</span>
                        <span className="badge badge-blue">{grant.grant_type}</span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{grant.title}</h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>{grant.description}</p>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {grant.currency} {grant.amount_min.toLocaleString()} – {grant.amount_max.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        🏛️ {grant.ministry}
                      </div>
                    </div>
                    <div className="card-footer">
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => { if (!isAuthenticated) { toast.error('Please log in to apply'); } else { toast.success('Redirecting to application form...'); } }}>
                        Apply for Grant
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', animation: 'fadeIn 0.2s ease' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Register Your Startup</h2>
              <button onClick={() => setRegisterModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>×</button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div className="form-group">
                  <label className="form-label">Startup Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. AgriConnect LR" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tagline</label>
                  <input className="form-input" value={form.tagline} onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="One-line description" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="What does your startup do?" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Sector *</label>
                    <select className="form-input" value={form.sector} onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))}>
                      {SECTORS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stage *</label>
                    <select className="form-input" value={form.stage} onChange={(e) => setForm(f => ({ ...f, stage: e.target.value }))}>
                      {STAGES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setRegisterModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={registering} style={{ flex: 2, justifyContent: 'center' }}>
                  {registering ? <><span className="spinner" /> Registering...</> : 'Register Startup'}
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
