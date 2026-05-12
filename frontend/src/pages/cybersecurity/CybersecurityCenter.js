import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const LEVEL_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' };
const LEVEL_BADGE_BG = { critical: '#fef2f2', high: '#fff7ed', medium: '#fefce8', low: '#eff6ff' };

const STATUS_BADGE = {
  open: { bg: '#fef2f2', color: '#dc2626', label: 'Open' },
  investigating: { bg: '#fff7ed', color: '#ea580c', label: 'Investigating' },
  contained: { bg: '#fefce8', color: '#ca8a04', label: 'Contained' },
  resolved: { bg: '#f0fdf4', color: '#16a34a', label: 'Resolved' },
  closed: { bg: '#f9fafb', color: '#6b7280', label: 'Closed' },
};

const CVSS_COLOR = (score) => {
  if (score >= 9) return '#ef4444';
  if (score >= 7) return '#f97316';
  if (score >= 4) return '#eab308';
  return '#22c55e';
};

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  border: '1px solid var(--gray-200)', marginBottom: '1rem',
  boxSizing: 'border-box', fontSize: '0.9rem',
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ maxWidth: '560px', margin: 'auto', marginTop: '80px', padding: '2rem', borderRadius: '16px', background: '#fff', boxShadow: 'var(--shadow-xl)', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--gray-900)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CybersecurityCenter() {
  const { user } = useSelector(s => s.auth);

  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showVulnModal, setShowVulnModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', category: 'phishing', level: 'medium', affected_systems: '' });
  const [vulnForm, setVulnForm] = useState({ title: '', description: '', cvss_score: '', affected_system: '', cve_id: '', patch_available: false, patch_url: '' });
  const [incidentSuccess, setIncidentSuccess] = useState(false);
  const [incidentError, setIncidentError] = useState('');
  const [vulnSuccess, setVulnSuccess] = useState(false);
  const [vulnError, setVulnError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/cybersecurity/stats').catch(() => ({ data: null })),
      api.get('/cybersecurity/threats', { params: { page_size: 8 } }).catch(() => ({ data: { results: [] } })),
      api.get('/cybersecurity/incidents', { params: { page_size: 5 } }).catch(() => ({ data: { results: [] } })),
      api.get('/cybersecurity/vulnerabilities').catch(() => ({ data: { results: [] } })),
    ]).then(([sRes, tRes, iRes, vRes]) => {
      setStats(sRes.data);
      setThreats(tRes.data?.results || tRes.data || []);
      setIncidents(iRes.data?.results || iRes.data || []);
      setVulnerabilities(vRes.data?.results || vRes.data || []);
      setLoading(false);
    });
  }, []);

  const totalThreats = stats?.threats_by_level
    ? Object.values(stats.threats_by_level).reduce((a, b) => a + b, 0)
    : 0;
  const criticalThreats = stats?.threats_by_level?.critical || 0;
  const openIncidents = stats?.open_incidents || 0;
  const vulnCount = stats?.total_vulnerabilities || 0;

  const threatDist = stats?.threats_by_level || {};
  const maxThreat = Math.max(1, ...Object.values(threatDist));

  const submitIncident = async () => {
    setSubmitting(true);
    setIncidentError('');
    try {
      const payload = {
        ...incidentForm,
        affected_systems: incidentForm.affected_systems.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/cybersecurity/incidents', payload);
      setIncidentSuccess(true);
      setTimeout(() => { setShowIncidentModal(false); setIncidentSuccess(false); setIncidentForm({ title: '', description: '', category: 'phishing', level: 'medium', affected_systems: '' }); }, 1500);
    } catch (e) {
      setIncidentError(e?.response?.data?.detail || 'Failed to submit incident.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitVuln = async () => {
    setSubmitting(true);
    setVulnError('');
    try {
      const payload = { ...vulnForm, cvss_score: parseFloat(vulnForm.cvss_score) || 0 };
      if (!payload.patch_available) delete payload.patch_url;
      if (!payload.cve_id) delete payload.cve_id;
      await api.post('/cybersecurity/vulnerabilities', payload);
      setVulnSuccess(true);
      setTimeout(() => { setShowVulnModal(false); setVulnSuccess(false); setVulnForm({ title: '', description: '', cvss_score: '', affected_system: '', cve_id: '', patch_available: false, patch_url: '' }); }, 1500);
    } catch (e) {
      setVulnError(e?.response?.data?.detail || 'Failed to submit vulnerability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Cybersecurity Center" subtitle="National Cyber Defense Operations">
      {/* Hero Strip */}
      <div style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0a0a 40%, #1A3A6B 100%)', borderRadius: '16px', padding: '2rem 2.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,100,100,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>NATIONAL CYBERSECURITY CENTER</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.375rem' }}>🔐 National Cybersecurity Center</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>Protecting Liberia's Digital Infrastructure</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <span style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.375rem 0.875rem', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)' }}>🔴 LIVE</span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Active Threats', value: loading ? '—' : totalThreats, icon: '⚠️', color: '#ef4444', bg: '#fef2f2' },
          { label: 'Critical Threats', value: loading ? '—' : criticalThreats, icon: '🚨', color: '#7f1d1d', bg: '#fee2e2' },
          { label: 'Open Incidents', value: loading ? '—' : openIncidents, icon: '🔓', color: '#c2410c', bg: '#fff7ed' },
          { label: 'Vulnerabilities', value: loading ? '—' : vulnCount, icon: '🛡️', color: '#b45309', bg: '#fefce8' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--gray-200)', borderTop: `3px solid ${k.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{k.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{loading ? <div className="skeleton" style={{ height: '2rem', width: '60px' }} /> : k.value}</div>
              </div>
              <div style={{ background: k.bg, borderRadius: '10px', padding: '0.625rem', fontSize: '1.25rem' }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Left: Threat Feed */}
        <div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>⚡ Active Threat Feed</span>
              <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>LIVE</span>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--gray-100)' }}>
                    <div className="skeleton" style={{ height: '14px', width: '30%', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '18px', marginBottom: '0.375rem' }} />
                    <div className="skeleton" style={{ height: '13px', width: '80%' }} />
                  </div>
                ))
              ) : threats.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛡️</div>
                  <div className="empty-title">No active threats</div>
                  <div className="empty-desc">All systems clear</div>
                </div>
              ) : threats.map((t, i) => {
                const lc = LEVEL_COLORS[t.level] || '#6b7280';
                const lb = LEVEL_BADGE_BG[t.level] || '#f9fafb';
                return (
                  <div key={t.id || i} style={{ padding: '1rem', borderRadius: '10px', border: `1px solid ${lc}33`, background: `${lc}08`, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', borderRadius: '10px 0 0 10px', background: lc }} />
                    <div style={{ paddingLeft: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{ background: lb, color: lc, padding: '0.125rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', border: `1px solid ${lc}44` }}>{t.level}</span>
                        {t.category && <span className="chip" style={{ fontSize: '0.7rem' }}>{t.category}</span>}
                        {t.indicators?.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gray-400)' }}>{t.indicators.length} indicators</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>{t.title}</div>
                      {t.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.5rem' }}>{t.description}</div>
                      )}
                      <button className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>View Details</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Distribution + Incidents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Threat Level Distribution */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', padding: '1.125rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '1rem' }}>📊 Threat Level Distribution</div>
            {['critical', 'high', 'medium', 'low'].map(level => {
              const count = threatDist[level] || 0;
              const pct = maxThreat > 0 ? Math.round((count / maxThreat) * 100) : 0;
              const color = LEVEL_COLORS[level];
              return (
                <div key={level} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--gray-700)' }}>{level}</span>
                    <span style={{ color }}>{count}</span>
                  </div>
                  <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Incidents */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', flex: 1 }}>
            <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>🚨 Recent Incidents</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowIncidentModal(true)} style={{ fontSize: '0.75rem' }}>+ Report</button>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '8px' }} />)
              ) : incidents.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>No incidents</div>
              ) : incidents.map((inc, i) => {
                const st = STATUS_BADGE[inc.status] || STATUS_BADGE.open;
                return (
                  <div key={inc.id || i} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ background: st.bg, color: st.color, padding: '0.1rem 0.4rem', borderRadius: '5px', fontSize: '0.68rem', fontWeight: 700 }}>{st.label}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginLeft: 'auto' }}>{inc.level}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-900)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{inc.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerability Reports */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>🛡️ Vulnerability Reports</span>
          <button className="btn btn-outline btn-sm" onClick={() => setShowVulnModal(true)} style={{ fontSize: '0.75rem' }}>+ Report Vulnerability</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['CVE ID', 'Title', 'Affected System', 'CVSS Score', 'Status', 'Patch'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '20px' }} /></td></tr>
                ))
              ) : vulnerabilities.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No vulnerabilities reported</td></tr>
              ) : vulnerabilities.map((v, i) => {
                const scoreColor = CVSS_COLOR(v.cvss_score || 0);
                return (
                  <tr key={v.id || i} style={{ borderBottom: '1px solid var(--gray-100)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--blue-700)', fontWeight: 700 }}>{v.cve_id || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--gray-900)' }}>{v.title}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)' }}>{v.affected_system}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: `${scoreColor}22`, color: scoreColor, padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.875rem' }}>{v.cvss_score?.toFixed(1) || '—'}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {v.status && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--gray-100)', color: 'var(--gray-700)' }}>{v.status}</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '1rem' }}>{v.patch_available ? '✓' : '✗'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Incident Modal */}
      <Modal open={showIncidentModal} onClose={() => { setShowIncidentModal(false); setIncidentError(''); setIncidentSuccess(false); }} title="🚨 Report Security Incident">
        {incidentSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Incident reported successfully!</div>}
        {incidentError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{incidentError}</div>}
        <input style={inputStyle} placeholder="Incident Title" value={incidentForm.title} onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))} />
        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Describe the incident..." value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))} />
        <select style={inputStyle} value={incidentForm.category} onChange={e => setIncidentForm(f => ({ ...f, category: e.target.value }))}>
          {['phishing', 'malware', 'ransomware', 'ddos', 'data_breach', 'insider_threat', 'social_engineering', 'zero_day', 'apt', 'other'].map(c => (
            <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
        <select style={inputStyle} value={incidentForm.level} onChange={e => setIncidentForm(f => ({ ...f, level: e.target.value }))}>
          {['low', 'medium', 'high', 'critical'].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
        </select>
        <input style={inputStyle} placeholder="Affected Systems (comma-separated)" value={incidentForm.affected_systems} onChange={e => setIncidentForm(f => ({ ...f, affected_systems: e.target.value }))} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setShowIncidentModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submitIncident} disabled={submitting || !incidentForm.title}>{submitting ? 'Submitting...' : 'Submit Report'}</button>
        </div>
      </Modal>

      {/* Report Vulnerability Modal */}
      <Modal open={showVulnModal} onClose={() => { setShowVulnModal(false); setVulnError(''); setVulnSuccess(false); }} title="🛡️ Report Vulnerability">
        {vulnSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Vulnerability reported successfully!</div>}
        {vulnError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{vulnError}</div>}
        <input style={inputStyle} placeholder="Vulnerability Title" value={vulnForm.title} onChange={e => setVulnForm(f => ({ ...f, title: e.target.value }))} />
        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Description..." value={vulnForm.description} onChange={e => setVulnForm(f => ({ ...f, description: e.target.value }))} />
        <input style={inputStyle} placeholder="CVSS Score (0-10)" type="number" min="0" max="10" step="0.1" value={vulnForm.cvss_score} onChange={e => setVulnForm(f => ({ ...f, cvss_score: e.target.value }))} />
        <input style={inputStyle} placeholder="Affected System" value={vulnForm.affected_system} onChange={e => setVulnForm(f => ({ ...f, affected_system: e.target.value }))} />
        <input style={inputStyle} placeholder="CVE ID (optional, e.g. CVE-2024-1234)" value={vulnForm.cve_id} onChange={e => setVulnForm(f => ({ ...f, cve_id: e.target.value }))} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
          <input type="checkbox" checked={vulnForm.patch_available} onChange={e => setVulnForm(f => ({ ...f, patch_available: e.target.checked }))} />
          Patch Available
        </label>
        {vulnForm.patch_available && (
          <input style={inputStyle} placeholder="Patch URL" value={vulnForm.patch_url} onChange={e => setVulnForm(f => ({ ...f, patch_url: e.target.value }))} />
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setShowVulnModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submitVuln} disabled={submitting || !vulnForm.title}>{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
