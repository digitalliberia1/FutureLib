import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const COLORS = ['#1A3A6B', '#C8102E', '#D97706', '#059669', '#7C3AED', '#0891B2', '#DB2777', '#65A30D'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)', fontSize: '0.875rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--gray-700)' }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

export default function Analytics() {
  const [platform, setPlatform] = useState(null);
  const [learning, setLearning] = useState(null);
  const [economy, setEconomy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/platform').catch(() => ({ data: null })),
      api.get('/analytics/learning').catch(() => ({ data: null })),
      api.get('/analytics/economy').catch(() => ({ data: null })),
    ]).then(([pRes, lRes, eRes]) => {
      setPlatform(pRes.data); setLearning(lRes.data); setEconomy(eRes.data);
      setLoading(false);
    });
  }, []);

  const MOCK_GROWTH = [
    { month: 'Jan', users: 120, courses: 8, startups: 3 },
    { month: 'Feb', users: 340, courses: 22, startups: 8 },
    { month: 'Mar', users: 680, courses: 45, startups: 14 },
    { month: 'Apr', users: 1200, courses: 78, startups: 22 },
    { month: 'May', users: 2800, courses: 120, startups: 41 },
    { month: 'Jun', users: 5400, courses: 165, startups: 68 },
    { month: 'Jul', users: 8200, courses: 190, startups: 89 },
    { month: 'Aug', users: 10200, courses: 210, startups: 112 },
  ];

  return (
    <DashboardLayout title="National Analytics" subtitle="Platform-wide digital transformation statistics">
      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Citizens', value: platform?.users?.total ?? '—', icon: '👥', color: 'var(--blue-700)', sub: `${platform?.users?.citizens ?? 0} citizens` },
          { label: 'Courses Enrolled', value: platform?.learning?.total_enrollments ?? '—', icon: '📚', color: 'var(--green-600)', sub: `${platform?.learning?.completion_rate ?? 0}% completion` },
          { label: 'Active Startups', value: platform?.economy?.total_startups ?? '—', icon: '🚀', color: 'var(--red-600)', sub: `${platform?.economy?.open_jobs ?? 0} open jobs` },
          { label: 'Gov. Applications', value: platform?.government?.total_applications ?? '—', icon: '🏛️', color: 'var(--purple-600)', sub: 'service applications' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value?.toLocaleString()}</div>
                <div className="stat-change" style={{ color: 'var(--gray-400)', fontSize: '0.75rem', fontWeight: 400, marginTop: '0.25rem' }}>{s.sub}</div>
              </div>
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Growth chart */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <span style={{ fontWeight: 700 }}>📈 Platform Growth</span>
          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>8 months</span>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={MOCK_GROWTH}>
              <defs>
                {[['blue', '#1A3A6B'], ['green', '#059669'], ['red', '#C8102E']].map(([name, color]) => (
                  <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8125rem', paddingTop: '1rem' }} />
              <Area type="monotone" dataKey="users" name="Users" stroke="#1A3A6B" strokeWidth={2.5} fill="url(#grad-blue)" />
              <Area type="monotone" dataKey="courses" name="Enrollments" stroke="#059669" strokeWidth={2} fill="url(#grad-green)" />
              <Area type="monotone" dataKey="startups" name="Startups" stroke="#C8102E" strokeWidth={2} fill="url(#grad-red)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Courses by category */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700 }}>📚 Courses by Category</span></div>
          <div className="card-body">
            {learning?.categories?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={learning.categories.slice(0, 8)} layout="vertical" barSize={14}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', width: 130 }} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="courses" name="Courses" radius={[0, 6, 6, 0]}>
                    {(learning.categories.slice(0, 8) || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-icon">📚</div><div className="empty-title">No course data yet</div></div>
            )}
          </div>
        </div>

        {/* Startups by sector */}
        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 700 }}>🚀 Startups by Sector</span></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {economy?.startups_by_sector?.length ? (
              <>
                <ResponsiveContainer width={160} height={200}>
                  <PieChart>
                    <Pie data={economy.startups_by_sector} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="count">
                      {economy.startups_by_sector.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {economy.startups_by_sector.map((s, i) => (
                    <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>{s.sector}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: '2rem', width: '100%' }}><div className="empty-icon">🚀</div><div className="empty-title">No startup data</div></div>
            )}
          </div>
        </div>
      </div>

      {/* User breakdown */}
      <div className="card">
        <div className="card-header"><span style={{ fontWeight: 700 }}>👥 User Breakdown</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Citizens', value: platform?.users?.citizens || 0, icon: '👤', color: 'var(--blue-700)', bg: 'var(--blue-50)' },
              { label: 'Officials', value: platform?.users?.officials || 0, icon: '🏛️', color: 'var(--purple-600)', bg: 'var(--purple-100)' },
              { label: 'Founders', value: platform?.users?.founders || 0, icon: '🚀', color: 'var(--red-600)', bg: 'var(--red-50)' },
              { label: 'Educators', value: (platform?.users?.total || 0) - (platform?.users?.citizens || 0) - (platform?.users?.officials || 0) - (platform?.users?.founders || 0), icon: '🎓', color: 'var(--green-600)', bg: 'var(--green-50)' },
            ].map(u => (
              <div key={u.label} style={{ background: u.bg, borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{u.icon}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.75rem', color: u.color, lineHeight: 1 }}>{loading ? '—' : u.value.toLocaleString()}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' }}>{u.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
