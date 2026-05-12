import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  citizen: 'var(--blue-700)', government_official: 'var(--purple-600)',
  startup_founder: 'var(--red-600)', investor: 'var(--gold-500)',
  educator: 'var(--green-600)', admin: 'var(--gray-700)',
};
const STATUS_MAP = { active: 'badge-green', suspended: 'badge-red', pending_verification: 'badge-yellow', inactive: 'badge-gray' };
const PIE_COLORS = ['#1A3A6B','#7C3AED','#C8102E','#D97706','#059669','#374151'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', role: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').catch(() => ({ data: null })),
      api.get('/admin/courses').catch(() => ({ data: { courses: [] } })),
    ]).then(([sRes, cRes]) => {
      setStats(sRes.data);
      setCourses(cRes.data.courses || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [tab, userPage, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const params = { page: userPage, page_size: 15 };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch { setUsers([]); }
  };

  const updateStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, null, { params: { new_status: newStatus } });
      toast.success('Status updated');
      loadUsers();
    } catch { toast.error('Failed to update status'); }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, null, { params: { new_role: newRole } });
      toast.success('Role updated');
      loadUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const params = { title: broadcastForm.title, message: broadcastForm.message };
      if (broadcastForm.role) params.role = broadcastForm.role;
      await api.post('/admin/broadcast', null, { params });
      toast.success('Broadcast sent!');
      setBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', role: '' });
    } catch { toast.error('Broadcast failed'); } finally { setSubmitting(false); }
  };

  const toggleCourseStatus = async (courseId, current) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    try {
      await api.patch(`/admin/courses/${courseId}/status`, null, { params: { new_status: newStatus } });
      toast.success(`Course ${newStatus}`);
      const { data } = await api.get('/admin/courses');
      setCourses(data.courses || []);
    } catch { toast.error('Failed to update course'); }
  };

  const roleChartData = stats ? Object.entries(stats.users?.by_role || {}).map(([role, count]) => ({
    role: role.replace('_', ' '), count, color: ROLE_COLORS[role] || 'var(--gray-500)',
  })) : [];

  const pieData = roleChartData.map(d => ({ name: d.role, value: d.count }));

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'users', label: `👥 Users (${stats?.users?.total || 0})` },
    { key: 'courses', label: `📚 Courses (${courses.length})` },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Platform management and oversight">
      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Users', value: stats?.users?.total ?? '—', icon: '👥', color: 'var(--blue-700)', sub: `${stats?.users?.active ?? 0} active` },
          { label: 'Courses', value: stats?.content?.courses ?? '—', icon: '📚', color: 'var(--green-600)', sub: `${stats?.content?.enrollments ?? 0} enrollments` },
          { label: 'Startups', value: stats?.content?.startups ?? '—', icon: '🚀', color: 'var(--red-600)', sub: `${stats?.content?.jobs ?? 0} jobs` },
          { label: 'Applications', value: stats?.content?.applications ?? '—', icon: '📋', color: 'var(--purple-600)', sub: 'service applications' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value?.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>{s.sub}</div>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pending alerts */}
      {stats?.users?.pending > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <div><strong>{stats.users.pending} users</strong> are pending verification and may need review.</div>
        </div>
      )}

      {/* Tab bar + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)' }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '0.625rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: tab === key ? 'var(--blue-700)' : 'var(--gray-500)', borderBottom: tab === key ? '2px solid var(--blue-700)' : '2px solid transparent', marginBottom: '-1px' }}>
              {label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setBroadcastModal(true)}>📢 Broadcast</button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>👥 Users by Role</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={roleChartData} barSize={32}>
                    <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {roleChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>📊 User Status Breakdown</span></div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Active', value: stats?.users?.active || 0 },
                      { name: 'Pending', value: stats?.users?.pending || 0 },
                      { name: 'Suspended', value: stats?.users?.suspended || 0 },
                    ]} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                      {[0,1,2].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {[['Active', stats?.users?.active || 0, PIE_COLORS[0]], ['Pending', stats?.users?.pending || 0, PIE_COLORS[1]], ['Suspended', stats?.users?.suspended || 0, PIE_COLORS[2]]].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{label}</span>
                      </div>
                      <span style={{ fontWeight: 700 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{ fontWeight: 700 }}>📋 Platform Summary</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { label: 'Active Users', value: stats?.users?.active || 0, color: 'var(--green-600)', bg: 'var(--green-50)' },
                  { label: 'Pending Verification', value: stats?.users?.pending || 0, color: 'var(--gold-600)', bg: 'var(--gold-100)' },
                  { label: 'Suspended', value: stats?.users?.suspended || 0, color: 'var(--red-600)', bg: 'var(--red-50)' },
                  { label: 'Course Enrollments', value: stats?.content?.enrollments || 0, color: 'var(--blue-700)', bg: 'var(--blue-50)' },
                  { label: 'Open Jobs', value: stats?.content?.jobs || 0, color: 'var(--purple-600)', bg: 'var(--purple-100)' },
                  { label: 'Gov. Services', value: stats?.content?.services || 0, color: 'var(--gray-700)', bg: 'var(--gray-100)' },
                ].map(item => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: '10px', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.5rem', color: item.color, lineHeight: 1 }}>{loading ? '—' : item.value.toLocaleString()}</div>
                      <div style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' }}>{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setUserPage(1); }}>
              <option value="">All Roles</option>
              {['citizen','government_official','startup_founder','investor','educator','admin'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setUserPage(1); }}>
              <option value="">All Statuses</option>
              {['active','inactive','suspended','pending_verification'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>{userTotal} users</span>
          </div>

          <div className="card">
            <div className="table-wrap" style={{ borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>County</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: `${ROLE_COLORS[u.role]}18`, color: ROLE_COLORS[u.role], fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td><span className={`badge ${STATUS_MAP[u.status] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{u.status?.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{u.county || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{u.email_verified ? '✅' : '⚠️'}</td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <select
                            value={u.status}
                            onChange={e => updateStatus(u.id, e.target.value)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--gray-200)', cursor: 'pointer', background: '#fff' }}
                          >
                            {['active','inactive','suspended','pending_verification'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(userTotal / 15) > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                <button className="btn btn-outline btn-sm" disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.875rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>Page {userPage} of {Math.ceil(userTotal / 15)}</span>
                <button className="btn btn-outline btn-sm" disabled={userPage >= Math.ceil(userTotal / 15)} onClick={() => setUserPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {tab === 'courses' && (
        <div className="card">
          <div className="table-wrap" style={{ borderRadius: '12px', border: '1px solid var(--gray-200)' }}>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Category</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gray-900)', maxWidth: '200px' }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</div>
                    </td>
                    <td style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{c.instructor_name}</td>
                    <td><span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{c.category}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--blue-700)' }}>{c.enrolled_count}</td>
                    <td><span className={`badge ${c.status === 'published' ? 'badge-green' : c.status === 'draft' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => toggleCourseStatus(c.id, c.status)}>
                        {c.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {broadcastModal && (
        <div className="modal-overlay" onClick={() => setBroadcastModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem' }}>📢 Broadcast Notification</h2>
              <button onClick={() => setBroadcastModal(false)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)' }}>×</button>
            </div>
            <form onSubmit={sendBroadcast}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label form-label-req">Title</label>
                  <input className="form-input" value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))} required placeholder="Notification title" />
                </div>
                <div>
                  <label className="form-label form-label-req">Message</label>
                  <textarea className="form-input" rows={4} value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))} required placeholder="Notification message..." />
                </div>
                <div>
                  <label className="form-label">Target Audience</label>
                  <select className="form-input" value={broadcastForm.role} onChange={e => setBroadcastForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="">All Users</option>
                    {['citizen','government_official','startup_founder','investor','educator'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setBroadcastModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2, justifyContent: 'center' }}>
                  {submitting ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
