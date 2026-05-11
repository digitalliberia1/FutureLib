import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SECTORS = ['All', 'AgriTech', 'EdTech', 'FinTech', 'HealthTech', 'CleanTech', 'E-commerce', 'Logistics', 'GovTech', 'Other'];
const STAGES = ['All', 'idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'scale'];

const STAGE_COLORS = {
  idea: '#6B7280', prototype: 'var(--blue-600)', mvp: 'var(--purple-600)',
  early_revenue: 'var(--gold-600)', growth: 'var(--green-600)', scale: 'var(--green-700)',
};

const SECTOR_BG = {
  AgriTech: ['#d1fae5', 'var(--green-700)'], EdTech: ['var(--blue-50)', 'var(--blue-700)'],
  FinTech: ['#fef3c7', 'var(--gold-700)'], HealthTech: ['#fee2e2', 'var(--red-600)'],
  CleanTech: ['#ecfdf5', 'var(--green-600)'], 'E-commerce': ['#f3e8ff', 'var(--purple-600)'],
  Logistics: ['#dbeafe', 'var(--blue-500)'], GovTech: ['var(--blue-50)', 'var(--blue-800)'],
  Other: ['var(--gray-100)', 'var(--gray-600)'],
};

export default function InvestorPortal() {
  const { user } = useSelector((s) => s.auth);
  const [startups, setStartups] = useState([]);
  const [myInterests, setMyInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [tab, setTab] = useState('discover');
  const [interestModal, setInterestModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [interestForm, setInterestForm] = useState({ investment_amount: '', message: '', investment_type: 'equity' });
  const [expressedIds, setExpressedIds] = useState(new Set());

  useEffect(() => {
    const params = {};
    if (sector) params.sector = sector;
    if (stage) params.stage = stage;
    Promise.all([
      api.get('/investors/startups', { params }).catch(() => ({ data: { startups: [] } })),
      api.get('/investors/my-interests').catch(() => ({ data: { interests: [] } })),
    ]).then(([sRes, iRes]) => {
      setStartups(sRes.data.startups || []);
      const interests = iRes.data.interests || [];
      setMyInterests(interests);
      setExpressedIds(new Set(interests.map(i => i.startup_id)));
      setLoading(false);
    });
  }, [sector, stage]);

  const expressInterest = async () => {
    setSubmitting(true);
    try {
      await api.post('/investors/interest', {
        startup_id: interestModal.id,
        investment_amount: interestForm.investment_amount ? parseFloat(interestForm.investment_amount) : undefined,
        message: interestForm.message || undefined,
        investment_type: interestForm.investment_type,
      });
      toast.success('Investment interest expressed! The founder will be notified. 🤝');
      setExpressedIds(prev => new Set([...prev, interestModal.id]));
      setInterestModal(null);
      setInterestForm({ investment_amount: '', message: '', investment_type: 'equity' });
    } catch (err) {
      if (err.response?.data?.detail === 'Already expressed interest') {
        toast('You have already expressed interest in this startup', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.detail || 'Failed to express interest');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const TAB_CONFIG = [
    { key: 'discover', label: '🔍 Discover Startups' },
    { key: 'portfolio', label: `💼 My Portfolio (${myInterests.length})` },
  ];

  return (
    <DashboardLayout title="Investor Portal" subtitle="Discover and invest in Liberia's most promising startups">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', marginBottom: '1.75rem' }}>
        {TAB_CONFIG.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '0.75rem 1.375rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.9375rem', transition: 'all 0.15s',
            color: tab === key ? 'var(--blue-700)' : 'var(--gray-500)',
            borderBottom: tab === key ? '2px solid var(--blue-700)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SECTORS.slice(0, 6).map(s => (
                <button key={s} onClick={() => setSector(s === 'All' ? '' : s)} className={`chip${sector === (s === 'All' ? '' : s) ? ' active' : ''}`}>{s}</button>
              ))}
            </div>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem 0.875rem', fontSize: '0.875rem', marginLeft: 'auto' }}
              value={stage}
              onChange={(e) => setStage(e.target.value === 'All' ? '' : e.target.value)}
            >
              {STAGES.map(s => <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'All Stages' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>
              {loading ? 'Loading...' : `${startups.length} startup${startups.length !== 1 ? 's' : ''} available`}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card card-body">
                  <div className="skeleton" style={{ height: '80px', borderRadius: '10px', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ height: '14px', marginBottom: '0.25rem' }} />
                  <div className="skeleton" style={{ height: '14px', width: '75%' }} />
                </div>
              ))}
            </div>
          ) : startups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚀</div>
              <div className="empty-title">No startups match your filters</div>
              <div className="empty-desc">Try adjusting your sector or stage filters</div>
              <button className="btn btn-primary btn-sm" onClick={() => { setSector(''); setStage(''); }}>Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {startups.map((startup) => {
                const [bg, fg] = SECTOR_BG[startup.sector] || ['var(--gray-100)', 'var(--gray-600)'];
                const stageColor = STAGE_COLORS[startup.stage] || 'var(--gray-500)';
                const interested = expressedIds.has(startup.id);
                return (
                  <div key={startup.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Card header with sector color */}
                    <div style={{ background: bg, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', background: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.375rem', flexShrink: 0 }}>
                          {startup.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{startup.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{startup.sector}</div>
                        </div>
                      </div>
                      {startup.government_verified && (
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem', flexShrink: 0 }}>✓ Verified</span>
                      )}
                    </div>

                    <div className="card-body" style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.65, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {startup.tagline || startup.description}
                      </p>

                      {/* Stage indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--gray-100)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '9999px', background: stageColor, width: { idea: '10%', prototype: '25%', mvp: '40%', early_revenue: '60%', growth: '80%', scale: '100%' }[startup.stage] || '10%', transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stageColor, textTransform: 'capitalize', flexShrink: 0 }}>
                          {startup.stage?.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        <div><span style={{ fontWeight: 700, color: 'var(--gray-700)' }}>{startup.employee_count}</span> employees</div>
                        {startup.is_hiring && <div style={{ color: 'var(--green-600)', fontWeight: 600 }}>⚡ Hiring</div>}
                        <div>By <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{startup.founder_name}</span></div>
                      </div>
                    </div>

                    <div className="card-footer" style={{ display: 'flex', gap: '0.5rem' }}>
                      {interested ? (
                        <div style={{ flex: 1, background: 'var(--green-50)', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--green-700)', fontWeight: 700 }}>
                          ✓ Interest Expressed
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => setInterestModal(startup)}
                        >
                          Express Interest
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'portfolio' && (
        <div>
          {myInterests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <div className="empty-title">No investments yet</div>
              <div className="empty-desc">Discover promising startups and express your investment interest</div>
              <button className="btn btn-primary btn-sm" onClick={() => setTab('discover')}>Discover Startups</button>
            </div>
          ) : (
            <>
              {/* Portfolio summary */}
              <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
                {[
                  { label: 'Total Interests', value: myInterests.length, icon: '🤝', color: 'var(--blue-700)' },
                  { label: 'Pending Response', value: myInterests.filter(i => i.status === 'pending').length, icon: '⏳', color: 'var(--gold-500)' },
                  { label: 'In Discussions', value: myInterests.filter(i => i.status === 'in_discussion').length, icon: '💬', color: 'var(--purple-600)' },
                  { label: 'Committed', value: myInterests.filter(i => i.status === 'committed').length, icon: '✅', color: 'var(--green-600)' },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                      </div>
                      <span style={{ fontSize: '1.75rem' }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <span style={{ fontWeight: 700 }}>💼 My Investment Interests</span>
                </div>
                <div className="table-wrap" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--gray-100)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Startup</th>
                        <th>Sector</th>
                        <th>Investment Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myInterests.map((interest) => (
                        <tr key={interest.id}>
                          <td style={{ fontWeight: 700 }}>{interest.startup_name}</td>
                          <td><span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{interest.startup_sector}</span></td>
                          <td style={{ textTransform: 'capitalize', color: 'var(--gray-600)' }}>{interest.investment_type}</td>
                          <td style={{ fontWeight: 700, color: 'var(--green-600)' }}>
                            {interest.investment_amount ? `$${interest.investment_amount.toLocaleString()}` : '—'}
                          </td>
                          <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                            {new Date(interest.created_at).toLocaleDateString()}
                          </td>
                          <td><InterestStatusBadge status={interest.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Express Interest Modal */}
      {interestModal && (
        <div className="modal-overlay" onClick={() => setInterestModal(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Investment Interest</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--gray-900)' }}>{interestModal.name}</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>{interestModal.sector} · {interestModal.stage?.replace('_', ' ')}</div>
              </div>
              <button onClick={() => setInterestModal(null)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)', flexShrink: 0 }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Investment Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                  {['equity', 'debt', 'grant', 'convertible_note'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterestForm(f => ({ ...f, investment_type: type }))}
                      style={{
                        padding: '0.625rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                        border: `2px solid ${interestForm.investment_type === type ? 'var(--blue-700)' : 'var(--gray-200)'}`,
                        background: interestForm.investment_type === type ? 'var(--blue-50)' : '#fff',
                        color: interestForm.investment_type === type ? 'var(--blue-700)' : 'var(--gray-600)',
                        fontWeight: interestForm.investment_type === type ? 700 : 400,
                        fontSize: '0.8125rem', textTransform: 'capitalize',
                      }}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Investment Amount (USD) <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={interestForm.investment_amount}
                  onChange={(e) => setInterestForm(f => ({ ...f, investment_amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">Message to Founder <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Introduce yourself and explain why you're interested in this startup..."
                  value={interestForm.message}
                  onChange={(e) => setInterestForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <div style={{ background: 'var(--gold-100)', borderRadius: '10px', padding: '0.875rem', border: '1px solid #fde68a', fontSize: '0.8125rem', color: 'var(--gold-700)' }}>
                🔒 Your contact information will be shared with the startup founder once they accept your interest.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setInterestModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={expressInterest} disabled={submitting} style={{ flex: 2, justifyContent: 'center' }}>
                {submitting ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Sending...</> : '🤝 Express Interest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function InterestStatusBadge({ status }) {
  const map = {
    pending: ['badge-yellow', '⏳', 'Pending'],
    in_discussion: ['badge-blue', '💬', 'In Discussion'],
    committed: ['badge-green', '✅', 'Committed'],
    declined: ['badge-red', '❌', 'Declined'],
  };
  const [cls, icon, label] = map[status] || ['badge-gray', '•', status];
  return <span className={`badge ${cls}`}>{icon} {label}</span>;
}
