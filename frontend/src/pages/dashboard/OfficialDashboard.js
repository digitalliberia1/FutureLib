import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';

export default function OfficialDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/government/stats').catch(() => ({ data: {} })),
      api.get('/government/applications?page_size=5').catch(() => ({ data: { applications: [] } })),
    ]).then(([statsRes, appsRes]) => {
      setStats(statsRes.data);
      setRecentApplications(appsRes.data.applications || []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #002560 0%, #003580 100%)',
          borderRadius: '1rem', padding: '2rem', color: '#fff', marginBottom: '2rem',
        }}>
          <p style={{ opacity: 0.8, marginBottom: '0.25rem' }}>Government Official Portal</p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{user?.full_name}</h1>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>
            {user?.ministry || 'Ministry'} — {user?.position || 'Officer'}
          </p>
        </div>

        {/* Stats */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Total Services" value={stats.total_services || 0} icon="🏛️" color="#003580" />
            <StatCard label="Total Applications" value={stats.total_applications || 0} icon="📋" color="#9333ea" />
            <StatCard label="Pending Review" value={stats.pending_review || 0} icon="⏳" color="#d97706" />
            <StatCard label="Approved" value={stats.approved || 0} icon="✅" color="#16a34a" />
          </div>
        )}

        <div className="grid-2">
          {/* Recent Applications */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Applications</h2>
              <Link to="/government/applications" style={{ fontSize: '0.875rem', fontWeight: 600 }}>View All →</Link>
            </div>
            {loading ? (
              <div className="card card-body" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading...</div>
            ) : recentApplications.length === 0 ? (
              <div className="card card-body" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                No applications yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentApplications.map((a) => (
                  <div key={a.id} className="card card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{a.service_name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{a.applicant_name} · {a.reference_number}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Management</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: '📋', label: 'Review Applications', desc: 'Process citizen service applications', link: '/services', color: '#003580' },
                { icon: '🚀', label: 'Verify Startups', desc: 'Review and approve registered startups', link: '/startups', color: '#c8102e' },
                { icon: '💰', label: 'Manage Grants', desc: 'Create and review grant applications', link: '/startups', color: '#d97706' },
                { icon: '📊', label: 'Analytics', desc: 'View national platform statistics', link: '#', color: '#9333ea' },
              ].map((item) => (
                <Link key={item.label} to={item.link} style={{ textDecoration: 'none' }}>
                  <div className="card card-body" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', borderLeft: `4px solid ${item.color}`, transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                  >
                    <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{item.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card card-body" style={{ borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.375rem' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div>
        </div>
        <span style={{ fontSize: '1.75rem' }}>{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    submitted: ['badge-blue', 'Submitted'],
    under_review: ['badge-yellow', 'In Review'],
    approved: ['badge-green', 'Approved'],
    rejected: ['badge-red', 'Rejected'],
    completed: ['badge-green', 'Completed'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
