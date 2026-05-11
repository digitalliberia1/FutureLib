import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const STATUS_COLORS = { submitted: 'var(--blue-500)', under_review: 'var(--gold-500)', approved: 'var(--green-600)', rejected: 'var(--red-500)', completed: 'var(--green-700)' };

export default function OfficialDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [govAnalytics, setGovAnalytics] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/government/stats').catch(() => ({ data: {} })),
      api.get('/analytics/government').catch(() => ({ data: {} })),
      api.get('/government/applications?page_size=6').catch(() => ({ data: { applications: [] } })),
    ]).then(([sRes, gRes, aRes]) => {
      setStats(sRes.data);
      setGovAnalytics(gRes.data);
      setRecentApps(aRes.data.applications || []);
      setLoading(false);
    });
  }, []);

  const statusChartData = govAnalytics?.applications_by_status
    ? Object.entries(govAnalytics.applications_by_status).map(([status, count]) => ({ status: status.replace(/_/g, ' '), count, color: STATUS_COLORS[status] || 'var(--gray-400)' }))
    : [];

  return (
    <DashboardLayout title="Government Dashboard" subtitle={`${user?.ministry || 'Ministry'} · ${user?.position || 'Officer'}`}>
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Services', value: stats?.total_services || 0, icon: '🏛️', color: 'var(--blue-700)' },
          { label: 'Total Applications', value: stats?.total_applications || 0, icon: '📋', color: 'var(--purple-600)' },
          { label: 'Pending Review', value: stats?.pending_review || 0, icon: '⏳', color: 'var(--gold-500)' },
          { label: 'Approved', value: stats?.approved || 0, icon: '✅', color: 'var(--green-600)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Bar chart */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700 }}>📊 Applications by Status</span></div>
          <div className="card-body">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} barSize={32}>
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon">📊</div>
                <div className="empty-title">No data yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Management links */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700 }}>⚡ Quick Management</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '📋', label: 'Review Applications', desc: 'Process citizen service applications', to: '/services', color: 'var(--blue-700)' },
              { icon: '🚀', label: 'Verify Startups', desc: 'Review and approve startup registrations', to: '/startups', color: 'var(--red-600)' },
              { icon: '💰', label: 'Manage Grants', desc: 'Create & review grant applications', to: '/startups', color: 'var(--gold-600)' },
              { icon: '📊', label: 'National Analytics', desc: 'View platform-wide statistics', to: '/analytics', color: 'var(--purple-600)' },
            ].map(item => (
              <Link key={item.label} to={item.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', gap: '0.875rem', alignItems: 'center', padding: '0.875rem 1rem',
                  borderRadius: '10px', background: 'var(--gray-50)', border: `1px solid var(--gray-200)`,
                  borderLeft: `4px solid ${item.color}`, cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-50)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; e.currentTarget.style.transform = ''; }}
                >
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{item.desc}</div>
                  </div>
                  <span style={{ color: item.color, fontWeight: 700 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent applications table */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>🕐 Recent Applications</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>{recentApps.length} shown</span>
        </div>
        {loading ? (
          <div className="card-body">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '0.75rem', borderRadius: '8px' }} />)}</div>
        ) : recentApps.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No applications yet</div></div>
        ) : (
          <div className="table-wrap" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--gray-100)' }}>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Applicant</th>
                  <th>Reference</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.service_name}</td>
                    <td>{a.applicant_name}</td>
                    <td><code style={{ fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{a.reference_number}</code></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{new Date(a.submitted_at).toLocaleDateString()}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const map = { submitted: ['badge-blue', '📤'], under_review: ['badge-yellow', '🔍'], approved: ['badge-green', '✅'], rejected: ['badge-red', '❌'], completed: ['badge-green', '✓'] };
  const [cls, icon] = map[status] || ['badge-gray', '●'];
  return <span className={`badge ${cls}`}>{icon} {status.replace(/_/g, ' ')}</span>;
}
