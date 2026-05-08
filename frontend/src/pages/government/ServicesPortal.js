import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  'Business License': '📄', 'Tax Services': '💰', 'Education': '📚',
  'Healthcare': '🏥', 'Permits': '✅', 'Identification': '🪪',
  'Social Services': '🤝', 'Infrastructure': '🏗️', 'Legal': '⚖️', 'Agriculture': '🌾',
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

  const handleApply = async (service) => {
    if (!isAuthenticated) {
      toast.error('Please log in to apply for services');
      return;
    }
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '3rem 1rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>Government Services Portal</h1>
        <p style={{ opacity: 0.85, fontSize: '1.125rem', maxWidth: '550px', margin: '0 auto' }}>
          Access all government services digitally — anytime, from anywhere in Liberia.
        </p>
      </div>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
          {['services', ...(isAuthenticated ? ['my-applications'] : [])].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9375rem',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
            }}>
              {t === 'services' ? '🏛️ All Services' : `📋 My Applications (${myApps.length})`}
            </button>
          ))}
        </div>

        {tab === 'services' && (
          <>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)} className="btn btn-sm" style={{
                  background: selectedCategory === (cat === 'All' ? '' : cat) ? 'var(--color-primary)' : '#fff',
                  color: selectedCategory === (cat === 'All' ? '' : cat) ? '#fff' : 'var(--color-text-muted)',
                  border: '1.5px solid var(--color-border)',
                }}>
                  {CATEGORY_ICONS[cat] || ''} {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading services...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
                <p style={{ color: 'var(--color-text-muted)' }}>No services found</p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map((service) => (
                  <div key={service.id} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  >
                    <div className="card-body">
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{CATEGORY_ICONS[service.category] || '🏛️'}</div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.375rem' }}>{service.name}</h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>{service.description}</p>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>🏛️ {service.ministry}</span>
                        <span>⏱️ {service.processing_days} working days</span>
                        <span>💵 {service.fee === 0 ? 'Free' : `${service.fee_currency} ${service.fee}`}</span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleApply(service)}>
                        Apply Now →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'my-applications' && (
          <div>
            {myApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No applications yet</p>
                <button className="btn btn-primary" onClick={() => setTab('services')}>Browse Services</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myApps.map((app) => (
                  <div key={app.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{app.service_name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        Ref: <strong>{app.reference_number}</strong> · Submitted {new Date(app.submitted_at).toLocaleDateString()}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', animation: 'fadeIn 0.2s ease' }}>
            <div className="card-header">
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Apply: {applyModal.name}</h2>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{applyModal.description}</p>
              {applyModal.required_documents?.length > 0 && (
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius)', padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Required Documents:</div>
                  {applyModal.required_documents.map((doc, i) => (
                    <div key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>• {doc}</div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                ⏱️ Processing time: <strong>{applyModal.processing_days} working days</strong><br />
                💵 Fee: <strong>{applyModal.fee === 0 ? 'Free' : `${applyModal.fee_currency} ${applyModal.fee}`}</strong>
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setApplyModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={submitApplication} disabled={applying} style={{ flex: 2, justifyContent: 'center' }}>
                {applying ? <><span className="spinner" /> Submitting...</> : 'Submit Application'}
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
    submitted: ['badge-blue', '📤 Submitted'],
    under_review: ['badge-yellow', '🔍 In Review'],
    approved: ['badge-green', '✅ Approved'],
    rejected: ['badge-red', '❌ Rejected'],
    completed: ['badge-green', '✓ Completed'],
    additional_info_required: ['badge-yellow', '⚠️ Info Needed'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
