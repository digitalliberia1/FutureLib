import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  'Business License': '📄', 'Tax Services': '💰', 'Education': '📚',
  'Healthcare': '🏥', 'Permits': '✅', 'Identification': '🪪',
  'Social Services': '🤝', 'Infrastructure': '🏗️', 'Legal': '⚖️', 'Agriculture': '🌾',
};

const CATEGORY_COLORS = {
  'Business License': 'var(--blue-700)', 'Tax Services': 'var(--gold-500)', 'Education': 'var(--purple-600)',
  'Healthcare': 'var(--red-600)', 'Permits': 'var(--green-600)', 'Identification': 'var(--blue-500)',
  'Social Services': 'var(--gold-600)', 'Infrastructure': 'var(--gray-600)', 'Legal': 'var(--red-700)', 'Agriculture': 'var(--green-700)',
};

export default function ServicesPortal() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [services, setServices] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [applyModal, setApplyModal] = useState(null);
  const [applying, setApplying] = useState(false);
  const [tab, setTab] = useState('services');

  useEffect(() => {
    Promise.all([
      api.get('/government/services').catch(() => ({ data: { services: [] } })),
      api.get('/government/categories').catch(() => ({ data: { categories: [] } })),
      isAuthenticated ? api.get('/government/applications/my').catch(() => ({ data: { applications: [] } })) : Promise.resolve({ data: { applications: [] } }),
    ]).then(([svcRes, catRes, appRes]) => {
      setServices(svcRes.data.services || []);
      setCategories(['All', ...(catRes.data.categories || [])]);
      setMyApps(appRes.data.applications || []);
      setLoading(false);
    });
  }, [isAuthenticated]);

  const filtered = selectedCategory && selectedCategory !== 'All'
    ? services.filter(s => s.category === selectedCategory)
    : services;

  const handleApply = (service) => {
    if (!isAuthenticated) { toast.error('Please log in to apply for services'); return; }
    setApplyModal(service);
  };

  const submitApplication = async () => {
    setApplying(true);
    try {
      const { data } = await api.post(`/government/services/${applyModal.id}/apply`, { form_data: {} });
      toast.success(`Application submitted! Reference: ${data.reference_number}`);
      setApplyModal(null);
      if (isAuthenticated) {
        const appRes = await api.get('/government/applications/my');
        setMyApps(appRes.data.applications || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', color: '#fff', padding: '3.5rem 1.25rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(200,16,46,0.15) 0%, transparent 55%), radial-gradient(circle at 80% 30%, rgba(245,158,11,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>Republic of Liberia</div>
          <h1 className="heading-display" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.875rem' }}>Government Services Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', maxWidth: '540px', marginBottom: '2rem' }}>
            Access all government services digitally — apply for licenses, permits, IDs and more from anywhere in Liberia.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2rem' }}>
            {[
              [services.length || '—', 'Available Services'],
              [myApps.length, 'My Applications'],
              ['100%', 'Online Process'],
            ].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: 'var(--gold-400)', fontWeight: 900, fontSize: '1.5rem' }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {['services', ...(isAuthenticated ? ['my-applications'] : [])].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '0.875rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9375rem', transition: 'all 0.15s',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                borderBottom: tab === t ? '3px solid var(--gold-400)' : '3px solid transparent',
              }}>
                {t === 'services' ? '🏛️ All Services' : `📋 My Applications ${myApps.length > 0 ? `(${myApps.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem', flex: 1 }}>
        {tab === 'services' && (
          <>
            {/* Category chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem', paddingTop: '0.5rem' }}>
              {categories.map((cat) => {
                const active = selectedCategory === (cat === 'All' ? '' : cat);
                return (
                  <button key={cat} onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                    className={`chip${active ? ' active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {CATEGORY_ICONS[cat] || ''} {cat}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>
                {loading ? 'Loading...' : `${filtered.length} service${filtered.length !== 1 ? 's' : ''} available`}
              </div>
              {selectedCategory && (
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCategory('')}>✕ Clear filter</button>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card card-body">
                    <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: '12px', marginBottom: '0.875rem' }} />
                    <div className="skeleton" style={{ height: '16px', width: '60%', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '14px', marginBottom: '0.25rem' }} />
                    <div className="skeleton" style={{ height: '14px', width: '75%' }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏛️</div>
                <div className="empty-title">No services found</div>
                <div className="empty-desc">Try a different category</div>
                <button className="btn btn-primary btn-sm" onClick={() => setSelectedCategory('')}>View All</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {filtered.map((service) => {
                  const color = CATEGORY_COLORS[service.category] || 'var(--blue-700)';
                  return (
                    <div key={service.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="card-body" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ width: '3rem', height: '3rem', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: `1px solid ${color}30` }}>
                            {CATEGORY_ICONS[service.category] || '🏛️'}
                          </div>
                          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{service.category}</span>
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gray-900)', lineHeight: 1.4 }}>{service.name}</h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.65, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {service.description}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>🏛️ Ministry</span>
                            <span style={{ color: 'var(--gray-700)', fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{service.ministry}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>⏱️ Processing</span>
                            <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>{service.processing_days} days</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>💵 Fee</span>
                            <span style={{ color: service.fee === 0 ? 'var(--green-600)' : 'var(--gray-700)', fontWeight: 700 }}>
                              {service.fee === 0 ? 'FREE' : `${service.fee_currency} ${service.fee}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="card-footer">
                        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleApply(service)}>
                          Apply Now →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'my-applications' && (
          <div style={{ paddingTop: '1rem' }}>
            {myApps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No applications yet</div>
                <div className="empty-desc">Browse available government services to get started</div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('services')}>Browse Services</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myApps.map((app) => (
                  <div key={app.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '10px', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                        {CATEGORY_ICONS[app.service_category] || '🏛️'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{app.service_name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                          Ref: <code style={{ background: 'var(--gray-100)', padding: '0.125rem 0.375rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{app.reference_number}</code>
                          {' · '}Submitted {new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div className="modal-overlay" onClick={() => setApplyModal(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Service Application</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--gray-900)' }}>{applyModal.name}</h2>
              </div>
              <button onClick={() => setApplyModal(null)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)' }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>{applyModal.description}</p>

              {applyModal.required_documents?.length > 0 && (
                <div style={{ background: 'var(--blue-50)', borderRadius: '10px', padding: '1rem 1.125rem', marginBottom: '1.25rem', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.625rem', fontSize: '0.875rem', color: 'var(--blue-700)' }}>📎 Required Documents</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {applyModal.required_documents.map((doc, i) => (
                      <div key={i} style={{ fontSize: '0.875rem', color: 'var(--blue-700)', display: 'flex', gap: '0.5rem' }}>
                        <span>•</span> {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '0.875rem', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Processing Time</div>
                  <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{applyModal.processing_days} working days</div>
                </div>
                <div style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '0.875rem', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Application Fee</div>
                  <div style={{ fontWeight: 700, color: applyModal.fee === 0 ? 'var(--green-600)' : 'var(--gray-800)' }}>
                    {applyModal.fee === 0 ? 'FREE' : `${applyModal.fee_currency} ${applyModal.fee}`}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setApplyModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={submitApplication} disabled={applying} style={{ flex: 2, justifyContent: 'center' }}>
                {applying ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Submitting...</> : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    submitted: ['badge-blue', '📤', 'Submitted'],
    under_review: ['badge-yellow', '🔍', 'In Review'],
    approved: ['badge-green', '✅', 'Approved'],
    rejected: ['badge-red', '❌', 'Rejected'],
    completed: ['badge-green', '✓', 'Completed'],
    additional_info_required: ['badge-yellow', '⚠️', 'Info Needed'],
  };
  const [cls, icon, label] = map[status] || ['badge-gray', '●', status];
  return <span className={`badge ${cls}`}>{icon} {label}</span>;
}
