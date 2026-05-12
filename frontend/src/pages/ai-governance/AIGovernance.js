import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  border: '1px solid var(--gray-200)', marginBottom: '1rem',
  boxSizing: 'border-box', fontSize: '0.9rem',
};

const POLICY_TYPE_COLORS = {
  regulation: 'badge-red', guideline: 'badge-blue',
  standard: 'badge-green', framework: 'badge-yellow',
};

const RISK_LEVEL_COLORS = {
  minimal: { bg: '#f0fdf4', color: '#16a34a' },
  limited: { bg: '#eff6ff', color: '#2563eb' },
  high: { bg: '#fff7ed', color: '#ea580c' },
  unacceptable: { bg: '#fef2f2', color: '#dc2626' },
};

const AUDIT_TYPE_COLORS = {
  initial: 'badge-blue', periodic: 'badge-yellow',
  incident: 'badge-red', compliance: 'badge-green',
};

function Modal({ onClose, title, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ maxWidth: '560px', margin: 'auto', marginTop: '80px', marginBottom: '80px', padding: '2rem', borderRadius: '16px', background: '#fff', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--gray-900)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  return '#dc2626';
}

export default function AIGovernance() {
  const { user } = useSelector(s => s.auth);
  const isAdmin = user?.role === 'admin';
  const isOfficial = user?.role === 'government_official' || isAdmin;
  const isAuth = !!user;

  const [dashboard, setDashboard] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [models, setModels] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');

  const [policyStatusFilter, setPolicyStatusFilter] = useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [approvedOnly, setApprovedOnly] = useState(false);

  const [expandedModel, setExpandedModel] = useState(null);
  const [expandedAudit, setExpandedAudit] = useState(null);

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [policyForm, setPolicyForm] = useState({ title: '', description: '', policy_type: 'guideline', scope: '', key_principles: '', enforcement_body: '', effective_date: '', review_date: '' });
  const [modelForm, setModelForm] = useState({ name: '', description: '', model_type: 'classification', use_case: '', deploying_org: '', risk_level: 'limited', version: '', training_data_description: '' });
  const [policySuccess, setPolicySuccess] = useState(false);
  const [policyError, setPolicyError] = useState('');
  const [modelSuccess, setModelSuccess] = useState(false);
  const [modelError, setModelError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/ai-governance/dashboard').catch(() => ({ data: null })),
      api.get('/ai-governance/policies').catch(() => ({ data: { results: [] } })),
      api.get('/ai-governance/models').catch(() => ({ data: { results: [] } })),
      api.get('/ai-governance/audits').catch(() => ({ data: { results: [] } })),
    ]).then(([dRes, pRes, mRes, aRes]) => {
      setDashboard(dRes.data);
      setPolicies(pRes.data?.results || pRes.data?.policies || pRes.data || []);
      setModels(mRes.data?.results || mRes.data?.models || mRes.data || []);
      setAudits(aRes.data?.results || aRes.data?.audits || aRes.data || []);
      setLoading(false);
    });
  }, []);

  const filteredPolicies = policies.filter(p => {
    if (policyStatusFilter && p.status !== policyStatusFilter) return false;
    if (policyTypeFilter && p.policy_type !== policyTypeFilter) return false;
    return true;
  });

  const filteredModels = models.filter(m => {
    if (riskFilter && m.risk_level !== riskFilter) return false;
    if (approvedOnly && !m.is_approved) return false;
    return true;
  });

  const submitPolicy = async () => {
    setSubmitting(true);
    setPolicyError('');
    try {
      const payload = {
        ...policyForm,
        scope: policyForm.scope.split(',').map(s => s.trim()).filter(Boolean),
        key_principles: policyForm.key_principles.split('\n').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/ai-governance/policies', payload);
      setPolicySuccess(true);
      setTimeout(() => { setShowPolicyModal(false); setPolicySuccess(false); setPolicyForm({ title: '', description: '', policy_type: 'guideline', scope: '', key_principles: '', enforcement_body: '', effective_date: '', review_date: '' }); }, 1500);
    } catch (e) {
      setPolicyError(e?.response?.data?.detail || 'Failed to create policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitModel = async () => {
    setSubmitting(true);
    setModelError('');
    try {
      await api.post('/ai-governance/models', modelForm);
      setModelSuccess(true);
      setTimeout(() => { setShowModelModal(false); setModelSuccess(false); setModelForm({ name: '', description: '', model_type: 'classification', use_case: '', deploying_org: '', risk_level: 'limited', version: '', training_data_description: '' }); }, 1500);
    } catch (e) {
      setModelError(e?.response?.data?.detail || 'Failed to register model.');
    } finally {
      setSubmitting(false);
    }
  };

  const policyStatuses = [...new Set(policies.map(p => p.status).filter(Boolean))];
  const policyTypes = [...new Set(policies.map(p => p.policy_type).filter(Boolean))];

  return (
    <DashboardLayout title="AI Governance" subtitle="National AI Policy & Model Registry">
      {/* Hero strip */}
      <div style={{ background: 'linear-gradient(135deg, #1a0030 0%, #3b0070 40%, #1a1a3e 100%)', borderRadius: '16px', padding: '2rem 2.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>NATIONAL AI GOVERNANCE FRAMEWORK</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.375rem' }}>🤖 National AI Governance</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>Responsible AI for Liberia</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          {isOfficial && (
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setShowPolicyModal(true)}>+ Draft Policy</button>
          )}
          {isAuth && (
            <button className="btn btn-sm" style={{ background: 'rgba(167,139,250,0.25)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.4)' }} onClick={() => setShowModelModal(true)}>+ Register AI Model</button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card card-body"><div className="skeleton" style={{ height: '60px' }} /></div>
        )) : [
          { label: 'Total Policies', value: dashboard?.total_policies ?? policies.length, color: 'var(--gray-700)', bg: '#f9fafb' },
          { label: 'Active Policies', value: dashboard?.active_policies ?? policies.filter(p => p.status === 'active').length, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Models Registered', value: dashboard?.models_registered ?? models.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Models Approved', value: dashboard?.models_approved ?? models.filter(m => m.is_approved).length, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Recent Audits', value: dashboard?.recent_audits ?? audits.length, color: 'var(--blue-700)', bg: '#eff6ff' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '12px', padding: '1.125rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
        {[{ id: 'policies', label: '📋 Policies' }, { id: 'models', label: '🤖 Model Registry' }, { id: 'audits', label: '🔍 Audits' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === t.id ? '#7c3aed' : 'var(--gray-500)',
            borderBottom: activeTab === t.id ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <select value={policyStatusFilter} onChange={e => setPolicyStatusFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Statuses</option>
              {policyStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={policyTypeFilter} onChange={e => setPolicyTypeFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Types</option>
              {policyTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.25rem' }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '12px' }} />)}
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No policies found</div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.25rem' }}>
              {filteredPolicies.map((pol, i) => (
                <div key={pol.id || i} className="card card-hover">
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {pol.policy_type && <span className={`badge ${POLICY_TYPE_COLORS[pol.policy_type] || 'badge-blue'}`} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{pol.policy_type}</span>}
                      {pol.status && <span className={`badge ${pol.status === 'active' ? 'badge-green' : pol.status === 'draft' ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>{pol.status}</span>}
                      {pol.version && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>v{pol.version}</span>}
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '0.375rem', lineHeight: 1.35 }}>{pol.title}</h3>
                    {pol.authored_by && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.375rem' }}>By: {pol.authored_by}</div>}
                    {pol.enforcement_body && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Enforcement: <strong>{pol.enforcement_body}</strong></div>}
                    {pol.key_principles?.length > 0 && (
                      <ul style={{ paddingLeft: '1.125rem', margin: '0 0 0.75rem', color: 'var(--gray-600)', fontSize: '0.8125rem' }}>
                        {pol.key_principles.slice(0, 3).map((pr, j) => <li key={j} style={{ marginBottom: '0.2rem' }}>{pr}</li>)}
                      </ul>
                    )}
                    {pol.scope?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {pol.scope.map((sc, j) => <span key={j} className="chip" style={{ fontSize: '0.7rem' }}>{sc}</span>)}
                      </div>
                    )}
                    {pol.effective_date && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Effective: {new Date(pol.effective_date).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Model Registry Tab */}
      {activeTab === 'models' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Risk Levels</option>
              {['minimal', 'limited', 'high', 'unacceptable'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
              <input type="checkbox" checked={approvedOnly} onChange={e => setApprovedOnly(e.target.checked)} />
              Approved Only
            </label>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                    {['Name', 'Use Case', 'Type', 'Deploying Org', 'Risk Level', 'Approved', 'Explainability', 'Production', 'Version'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={9} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '20px' }} /></td></tr>
                  )) : filteredModels.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No models found</td></tr>
                  ) : filteredModels.map((m, i) => {
                    const rc = RISK_LEVEL_COLORS[m.risk_level] || RISK_LEVEL_COLORS.limited;
                    const isExpanded = expandedModel === (m.id || i);
                    return (
                      <React.Fragment key={m.id || i}>
                        <tr style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: isExpanded ? '#f5f3ff' : 'transparent' }}
                          onClick={() => setExpandedModel(isExpanded ? null : (m.id || i))}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--gray-50)'; }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--gray-900)' }}>{m.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)', maxWidth: '160px' }}>
                            <div style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.use_case}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)', textTransform: 'capitalize' }}>{m.model_type}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)' }}>{m.deploying_org}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ background: rc.bg, color: rc.color, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{m.risk_level}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '1rem' }}>
                            {m.is_approved === true ? '✓' : m.is_approved === false ? '✗' : '⏳'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', minWidth: '120px' }}>
                            {m.explainability_score != null && (
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--gray-700)' }}>{m.explainability_score}/100</div>
                                <div style={{ background: 'var(--gray-100)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${m.explainability_score}%`, height: '100%', background: scoreColor(m.explainability_score) }} />
                                </div>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            {m.in_production && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Live</span>}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-500)', fontSize: '0.8125rem' }}>v{m.version || '—'}</td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: '#f5f3ff', borderBottom: '1px solid var(--gray-200)' }}>
                            <td colSpan={9} style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
                                {m.description && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div><div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{m.description}</div></div>}
                                {m.training_data_description && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Training Data</div><div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{m.training_data_description}</div></div>}
                                {m.bias_assessment && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Bias Assessment</div><div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{m.bias_assessment}</div></div>}
                                {m.accuracy_score != null && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Accuracy Score</div><div style={{ fontWeight: 800, fontSize: '1rem', color: scoreColor(m.accuracy_score) }}>{m.accuracy_score}%</div></div>}
                                {m.registered_by && <div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Registered By</div><div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{m.registered_by}</div></div>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Audits Tab */}
      {activeTab === 'audits' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['Model', 'Audit Type', 'Auditor', 'Risk Assessment', 'Score', 'Passed', 'Date', 'Findings', 'Recommendations'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '20px' }} /></td></tr>
                )) : audits.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No audits found</td></tr>
                ) : audits.map((audit, i) => {
                  const isExpanded = expandedAudit === (audit.id || i);
                  const rc = RISK_LEVEL_COLORS[audit.risk_assessment] || RISK_LEVEL_COLORS.limited;
                  return (
                    <React.Fragment key={audit.id || i}>
                      <tr style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: isExpanded ? '#eff6ff' : 'transparent' }}
                        onClick={() => setExpandedAudit(isExpanded ? null : (audit.id || i))}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'var(--gray-50)'; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--gray-900)' }}>{audit.model_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${AUDIT_TYPE_COLORS[audit.audit_type] || 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>{audit.audit_type}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-700)' }}>{audit.auditor_name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {audit.risk_assessment && <span style={{ background: rc.bg, color: rc.color, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{audit.risk_assessment}</span>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {audit.overall_score != null && <span style={{ fontWeight: 800, color: scoreColor(audit.overall_score) }}>{audit.overall_score}</span>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '1rem' }}>
                          {audit.passed === true ? '✓' : audit.passed === false ? '✗' : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-400)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                          {audit.audit_date ? new Date(audit.audit_date).toLocaleDateString() : audit.created_at ? new Date(audit.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)' }}>{audit.findings?.length ?? 0}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--gray-700)' }}>{audit.recommendations?.length ?? 0}</td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: '#eff6ff', borderBottom: '1px solid var(--gray-200)' }}>
                          <td colSpan={9} style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                              {audit.findings?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Findings</div>
                                  <ul style={{ paddingLeft: '1.125rem', margin: 0, color: 'var(--gray-700)', fontSize: '0.8125rem' }}>
                                    {audit.findings.map((f, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{typeof f === 'string' ? f : f.description || JSON.stringify(f)}</li>)}
                                  </ul>
                                </div>
                              )}
                              {audit.recommendations?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recommendations</div>
                                  <ul style={{ paddingLeft: '1.125rem', margin: 0, color: 'var(--gray-700)', fontSize: '0.8125rem' }}>
                                    {audit.recommendations.map((r, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{typeof r === 'string' ? r : r.description || JSON.stringify(r)}</li>)}
                                  </ul>
                                </div>
                              )}
                              {audit.notes && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Notes</div>
                                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-700)' }}>{audit.notes}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Draft Policy Modal */}
      {showPolicyModal && (
        <Modal title="📋 Draft AI Policy" onClose={() => { setShowPolicyModal(false); setPolicyError(''); setPolicySuccess(false); }}>
          {policySuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Policy created successfully!</div>}
          {policyError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{policyError}</div>}
          <input style={inputStyle} placeholder="Policy Title *" value={policyForm.title} onChange={e => setPolicyForm(f => ({ ...f, title: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Description..." value={policyForm.description} onChange={e => setPolicyForm(f => ({ ...f, description: e.target.value }))} />
          <select style={inputStyle} value={policyForm.policy_type} onChange={e => setPolicyForm(f => ({ ...f, policy_type: e.target.value }))}>
            {['regulation', 'guideline', 'standard', 'framework'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <input style={inputStyle} placeholder="Scope (comma-separated)" value={policyForm.scope} onChange={e => setPolicyForm(f => ({ ...f, scope: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Key Principles (one per line)" value={policyForm.key_principles} onChange={e => setPolicyForm(f => ({ ...f, key_principles: e.target.value }))} />
          <input style={inputStyle} placeholder="Enforcement Body" value={policyForm.enforcement_body} onChange={e => setPolicyForm(f => ({ ...f, enforcement_body: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input style={inputStyle} placeholder="Effective Date" type="date" value={policyForm.effective_date} onChange={e => setPolicyForm(f => ({ ...f, effective_date: e.target.value }))} />
            <input style={inputStyle} placeholder="Review Date" type="date" value={policyForm.review_date} onChange={e => setPolicyForm(f => ({ ...f, review_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowPolicyModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitPolicy} disabled={submitting || !policyForm.title}>{submitting ? 'Creating...' : 'Draft Policy'}</button>
          </div>
        </Modal>
      )}

      {/* Register AI Model Modal */}
      {showModelModal && (
        <Modal title="🤖 Register AI Model" onClose={() => { setShowModelModal(false); setModelError(''); setModelSuccess(false); }}>
          {modelSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Model registered successfully!</div>}
          {modelError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{modelError}</div>}
          <input style={inputStyle} placeholder="Model Name *" value={modelForm.name} onChange={e => setModelForm(f => ({ ...f, name: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Description..." value={modelForm.description} onChange={e => setModelForm(f => ({ ...f, description: e.target.value }))} />
          <select style={inputStyle} value={modelForm.model_type} onChange={e => setModelForm(f => ({ ...f, model_type: e.target.value }))}>
            {['classification', 'nlp', 'cv', 'generative', 'predictive'].map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
          <input style={inputStyle} placeholder="Use Case *" value={modelForm.use_case} onChange={e => setModelForm(f => ({ ...f, use_case: e.target.value }))} />
          <input style={inputStyle} placeholder="Deploying Organization" value={modelForm.deploying_org} onChange={e => setModelForm(f => ({ ...f, deploying_org: e.target.value }))} />
          <select style={inputStyle} value={modelForm.risk_level} onChange={e => setModelForm(f => ({ ...f, risk_level: e.target.value }))}>
            {['minimal', 'limited', 'high', 'unacceptable'].map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
          <input style={inputStyle} placeholder="Version (e.g. 1.0.0)" value={modelForm.version} onChange={e => setModelForm(f => ({ ...f, version: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Training Data Description..." value={modelForm.training_data_description} onChange={e => setModelForm(f => ({ ...f, training_data_description: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowModelModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitModel} disabled={submitting || !modelForm.name}>{submitting ? 'Registering...' : 'Register Model'}</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
