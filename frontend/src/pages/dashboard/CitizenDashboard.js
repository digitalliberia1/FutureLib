import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const QUICK_ACTIONS = [
  { icon: '📚', label: 'Browse Courses', to: '/learn', color: 'var(--blue-700)', bg: 'var(--blue-50)' },
  { icon: '🏛️', label: 'Gov Services', to: '/services', color: 'var(--purple-600)', bg: 'var(--purple-100)' },
  { icon: '💼', label: 'Find Jobs', to: '/jobs', color: 'var(--green-600)', bg: 'var(--green-50)' },
  { icon: '🚀', label: 'Startups', to: '/startups', color: 'var(--red-600)', bg: 'var(--red-50)' },
  { icon: '💰', label: 'Apply Grant', to: '/startups#grants', color: 'var(--gold-600)', bg: 'var(--gold-100)' },
  { icon: '✨', label: 'AI Help', to: '/ai', color: 'var(--gold-500)', bg: 'var(--gold-100)' },
];

const MOCK_PROGRESS = [
  { week: 'W1', lessons: 3 }, { week: 'W2', lessons: 7 }, { week: 'W3', lessons: 4 },
  { week: 'W4', lessons: 9 }, { week: 'W5', lessons: 6 }, { week: 'W6', lessons: 12 },
];

const PIE_COLORS = ['var(--blue-700)', 'var(--green-600)', 'var(--gold-500)', 'var(--red-600)'];

export default function CitizenDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [enrollments, setEnrollments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/learning/my-courses').catch(() => ({ data: { enrollments: [] } })),
      api.get('/government/applications/my').catch(() => ({ data: { applications: [] } } )),
    ]).then(([cRes, aRes]) => {
      setEnrollments(cRes.data.enrollments || []);
      setApplications(aRes.data.applications || []);
      setLoading(false);
    });
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  const pieData = [
    { name: 'Enrolled', value: user?.courses_enrolled || 0 },
    { name: 'Completed', value: user?.courses_completed || 0 },
    { name: 'Points', value: Math.floor((user?.points || 0) / 10) },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout title={`${greeting()}, ${user?.full_name?.split(' ')[0] || 'there'} 👋`} subtitle="Here's what's happening on your FutureLib dashboard">
      {/* Email verification banner */}
      {!user?.email_verified && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <div>
            <strong>Verify your email</strong> to unlock all features. Check your inbox for a verification link.
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card" style={{ borderTop: '3px solid var(--blue-700)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Courses Enrolled</div>
              <div className="stat-value" style={{ color: 'var(--blue-700)' }}>{user?.courses_enrolled || 0}</div>
            </div>
            <span style={{ fontSize: '1.75rem' }}>📚</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--green-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Completed</div>
              <div className="stat-value" style={{ color: 'var(--green-600)' }}>{user?.courses_completed || 0}</div>
            </div>
            <span style={{ fontSize: '1.75rem' }}>🏅</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--gold-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Points Earned</div>
              <div className="stat-value" style={{ color: 'var(--gold-500)' }}>{user?.points || 0}</div>
            </div>
            <span style={{ fontSize: '1.75rem' }}>⭐</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--purple-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-label">Applications</div>
              <div className="stat-value" style={{ color: 'var(--purple-600)' }}>{applications.length}</div>
            </div>
            <span style={{ fontSize: '1.75rem' }}>📋</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>Quick Actions</span>
        </div>
        <div className="card-body" style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} to={a.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  padding: '1rem 0.5rem', borderRadius: '10px', background: a.bg, cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s', border: `1px solid transparent`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = a.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <span style={{ fontSize: '1.625rem' }}>{a.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: a.color, textAlign: 'center' }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Charts + content row */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Learning progress chart */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700 }}>📈 Learning Activity</span>
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Last 6 weeks</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={MOCK_PROGRESS}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A3A6B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A3A6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem' }} />
                <Area type="monotone" dataKey="lessons" stroke="#1A3A6B" strokeWidth={2.5} fill="url(#blueGrad)" dot={{ fill: '#1A3A6B', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress breakdown */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700 }}>🎯 Progress Breakdown</span></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {pieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem', width: '100%' }}>
                <div className="empty-icon">📚</div>
                <div className="empty-title">Start Learning</div>
                <Link to="/learn" className="btn btn-primary btn-sm">Browse Courses</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Courses + Applications */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700 }}>📚 My Courses</span>
            <Link to="/learn" style={{ marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--blue-700)' }}>Browse All →</Link>
          </div>
          {loading ? (
            <div className="card-body">
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '0.75rem', borderRadius: '8px' }} />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <div className="empty-title">No courses yet</div>
              <div className="empty-desc">Enroll in your first course to get started</div>
              <Link to="/learn" className="btn btn-primary btn-sm">Browse Courses</Link>
            </div>
          ) : (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {enrollments.slice(0, 4).map(e => (
                <div key={e.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{e.course_title}</span>
                    <span className={`badge ${e.status === 'completed' ? 'badge-green' : 'badge-blue'}`}>
                      {e.status === 'completed' ? '✓ Done' : 'Active'}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${e.progress_percent}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    <span>{e.progress_percent}% complete</span>
                    {e.certificate_issued && <span style={{ color: 'var(--gold-500)', fontWeight: 700 }}>🏅 Certificate issued</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 700 }}>📋 Service Applications</span>
            <Link to="/services" style={{ marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--blue-700)' }}>All Services →</Link>
          </div>
          {loading ? (
            <div className="card-body">
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '50px', marginBottom: '0.75rem', borderRadius: '8px' }} />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏛️</div>
              <div className="empty-title">No applications</div>
              <div className="empty-desc">Browse available government services</div>
              <Link to="/services" className="btn btn-primary btn-sm">Browse Services</Link>
            </div>
          ) : (
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {applications.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-100)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{a.service_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>{a.reference_number}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const map = { submitted: ['badge-blue', '📤'], under_review: ['badge-yellow', '🔍'], approved: ['badge-green', '✅'], rejected: ['badge-red', '❌'], completed: ['badge-green', '✓'] };
  const [cls, icon] = map[status] || ['badge-gray', '●'];
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <span className={`badge ${cls}`}>{icon} {label}</span>;
}
