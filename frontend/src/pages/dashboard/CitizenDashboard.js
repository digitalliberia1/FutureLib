import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';

const QUICK_ACTIONS = [
  { icon: '📚', label: 'Browse Courses', to: '/learn', color: '#003580' },
  { icon: '🚀', label: 'Register Startup', to: '/startups', color: '#c8102e' },
  { icon: '💼', label: 'Find Jobs', to: '/jobs', color: '#16a34a' },
  { icon: '🏛️', label: 'Gov Services', to: '/services', color: '#9333ea' },
  { icon: '💰', label: 'Apply for Grant', to: '/startups#grants', color: '#d97706' },
  { icon: '📋', label: 'My Applications', to: '/services#my', color: '#0891b2' },
];

export default function CitizenDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [enrollments, setEnrollments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/learning/my-courses').catch(() => ({ data: { enrollments: [] } })),
      api.get('/government/applications/my').catch(() => ({ data: { applications: [] } })),
    ]).then(([courseRes, appRes]) => {
      setEnrollments(courseRes.data.enrollments || []);
      setApplications(appRes.data.applications || []);
      setLoading(false);
    });
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem' }}>

        {/* Welcome */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #1a4fa0 100%)',
          borderRadius: '1rem', padding: '2rem', color: '#fff', marginBottom: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <p style={{ opacity: 0.85, marginBottom: '0.25rem' }}>{greeting()},</p>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{user?.full_name || 'Citizen'} 🇱🇷</h1>
            <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>Welcome to your FutureLib dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <StatPill label="Courses Enrolled" value={user?.courses_enrolled || 0} />
            <StatPill label="Completed" value={user?.courses_completed || 0} />
            <StatPill label="Points" value={user?.points || 0} icon="⭐" />
          </div>
        </div>

        {/* Quick Actions */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} to={a.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', borderTop: `3px solid ${a.color}` }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                >
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{a.icon}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>{a.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid-2">
          {/* My Courses */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>My Courses</h2>
              <Link to="/learn" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Browse All →</Link>
            </div>
            {loading ? (
              <div className="card card-body" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading...</div>
            ) : enrollments.length === 0 ? (
              <div className="card card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📚</div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No courses yet</p>
                <Link to="/learn" className="btn btn-primary btn-sm">Start Learning</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {enrollments.slice(0, 4).map((e) => (
                  <div key={e.id} className="card card-body" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{e.course_title}</span>
                      <span className={`badge ${e.status === 'completed' ? 'badge-green' : 'badge-blue'}`}>
                        {e.status === 'completed' ? '✓ Done' : 'Active'}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${e.progress_percent}%`, background: 'var(--color-primary)', borderRadius: '9999px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{e.progress_percent}% complete</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* My Applications */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Service Applications</h2>
              <Link to="/services" style={{ fontSize: '0.875rem', fontWeight: 600 }}>All Services →</Link>
            </div>
            {loading ? (
              <div className="card card-body" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading...</div>
            ) : applications.length === 0 ? (
              <div className="card card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No applications yet</p>
                <Link to="/services" className="btn btn-primary btn-sm">Browse Services</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {applications.slice(0, 5).map((a) => (
                  <div key={a.id} className="card card-body" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{a.service_name}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Ref: {a.reference_number}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Profile completeness banner */}
        {!user?.email_verified && (
          <div style={{
            marginTop: '2rem', background: '#fef9c3', border: '1px solid #fde047',
            borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong>Verify your email</strong> to unlock all features.
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'block' }}>
                Check your inbox for a verification link.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, icon }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{icon}{value}</div>
      <div style={{ fontSize: '0.8125rem', opacity: 0.8 }}>{label}</div>
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
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
