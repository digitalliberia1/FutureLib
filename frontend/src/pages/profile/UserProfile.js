import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMe } from '../../store/authSlice';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COUNTIES = ['Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh','Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba','Rivercess','River Gee','Sinoe'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const TABS = [
  { key: 'profile', label: '👤 Profile', icon: '👤' },
  { key: 'skills', label: '🎯 Skills', icon: '🎯' },
  { key: 'security', label: '🔒 Security', icon: '🔒' },
  { key: 'certificates', label: '🏅 Certificates', icon: '🏅' },
  { key: 'notifications', label: '🔔 Notifications', icon: '🔔' },
];

export default function UserProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    county: user?.county || '',
    city: user?.city || '',
    occupation: user?.occupation || '',
    education_level: user?.education_level || '',
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'beginner' });
  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const loadCerts = async () => {
    if (certs.length > 0) return;
    setCertsLoading(true);
    try {
      const { data } = await api.get('/certificates/my');
      setCerts(data.certificates || []);
    } catch { setCerts([]); } finally { setCertsLoading(false); }
  };

  const loadNotifications = async () => {
    if (notifications.length > 0) return;
    setNotifsLoading(true);
    try {
      const { data } = await api.get('/notifications/');
      setNotifications(data.notifications || []);
    } catch { setNotifications([]); } finally { setNotifsLoading(false); }
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'certificates') loadCerts();
    if (t === 'notifications') loadNotifications();
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me', profileForm);
      await dispatch(fetchMe());
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/me/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Password change failed');
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await api.post('/uploads/presigned-url', {
        filename: file.name,
        content_type: file.type,
        upload_type: 'avatar',
      });
      if (data.mock) {
        await api.post('/uploads/confirm', { s3_key: data.s3_key, upload_type: 'avatar' });
        toast.success('Avatar updated!');
        await dispatch(fetchMe());
      } else {
        await fetch(data.upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        await api.post('/uploads/confirm', { s3_key: data.s3_key, upload_type: 'avatar' });
        toast.success('Avatar updated!');
        await dispatch(fetchMe());
      }
    } catch {
      toast.error('Avatar upload failed');
    }
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    const updated = [...skills, { ...newSkill, verified: false }];
    try {
      await api.put('/users/me', { skills: updated });
      setSkills(updated);
      setNewSkill({ name: '', level: 'beginner' });
      toast.success('Skill added!');
    } catch { toast.error('Failed to add skill'); }
  };

  const removeSkill = async (idx) => {
    const updated = skills.filter((_, i) => i !== idx);
    try {
      await api.put('/users/me', { skills: updated });
      setSkills(updated);
    } catch { toast.error('Failed to remove skill'); }
  };

  const markNotifRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/mark-all-read').catch(() => {});
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const initials = user?.full_name?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your account settings and preferences">
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Avatar card */}
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" style={{ width: '5rem', height: '5rem', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--blue-100)' }} />
              ) : (
                <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-700), var(--blue-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.5rem', margin: '0 auto', border: '3px solid var(--blue-100)' }}>
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'var(--blue-700)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff' }}
              >
                📷
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>{user?.full_name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginBottom: '0.875rem', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              {[
                ['⭐', user?.points || 0, 'Points'],
                ['📚', user?.courses_completed || 0, 'Certs'],
              ].map(([icon, val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.125rem', color: 'var(--blue-700)' }}>{val}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
            {!user?.email_verified && (
              <div style={{ background: 'var(--gold-100)', borderRadius: '8px', padding: '0.5rem', border: '1px solid #fde68a', fontSize: '0.75rem', color: 'var(--gold-700)', fontWeight: 600 }}>
                ⚠️ Email not verified
              </div>
            )}
          </div>

          {/* Tab nav */}
          <div className="card card-body" style={{ padding: '0.5rem' }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`sidebar-link${tab === key ? ' active' : ''}`}
                style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '0.125rem' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div>
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>👤 Personal Information</span></div>
              <form onSubmit={saveProfile} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label form-label-req">Full Name</label>
                    <input className="form-input" value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+231 ..." />
                  </div>
                  <div>
                    <label className="form-label">County</label>
                    <select className="form-input" value={profileForm.county} onChange={e => setProfileForm(f => ({ ...f, county: e.target.value }))}>
                      <option value="">Select county</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">City / Town</label>
                    <input className="form-input" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Monrovia" />
                  </div>
                  <div>
                    <label className="form-label">Occupation</label>
                    <input className="form-input" value={profileForm.occupation} onChange={e => setProfileForm(f => ({ ...f, occupation: e.target.value }))} placeholder="e.g. Software Developer" />
                  </div>
                  <div>
                    <label className="form-label">Education Level</label>
                    <select className="form-input" value={profileForm.education_level} onChange={e => setProfileForm(f => ({ ...f, education_level: e.target.value }))}>
                      <option value="">Select level</option>
                      {['Primary', 'Secondary', 'Diploma', "Bachelor's", "Master's", 'PhD', 'Other'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" rows={3} value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself..." />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Skills Tab */}
          {tab === 'skills' && (
            <div className="card">
              <div className="card-header"><span style={{ fontWeight: 700 }}>🎯 My Skills</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'var(--blue-50)', borderRadius: '12px', padding: '1rem', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--blue-700)', marginBottom: '0.875rem' }}>Add a Skill</div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Skill Name</label>
                      <input className="form-input" value={newSkill.name} onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Python, HTML, Excel..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                    </div>
                    <div style={{ width: '160px' }}>
                      <label className="form-label">Level</label>
                      <select className="form-input" value={newSkill.level} onChange={e => setNewSkill(s => ({ ...s, level: e.target.value }))}>
                        {SKILL_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={addSkill} style={{ flexShrink: 0 }}>+ Add</button>
                  </div>
                </div>

                {skills.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-icon">🎯</div>
                    <div className="empty-title">No skills yet</div>
                    <div className="empty-desc">Add skills to showcase your expertise</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {skills.map((skill, idx) => {
                      const levelColors = { beginner: 'var(--green-600)', intermediate: 'var(--blue-700)', advanced: 'var(--purple-600)', expert: 'var(--gold-600)' };
                      const levelPct = { beginner: '25%', intermediate: '50%', advanced: '75%', expert: '100%' };
                      return (
                        <div key={idx} style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '0.875rem 1rem', border: '1px solid var(--gray-200)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{skill.name}</span>
                              <span style={{ fontSize: '0.75rem', color: levelColors[skill.level] || 'var(--gray-500)', fontWeight: 600, textTransform: 'capitalize' }}>{skill.level}</span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--gray-200)', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: levelColors[skill.level] || 'var(--blue-700)', width: levelPct[skill.level] || '25%', borderRadius: '9999px' }} />
                            </div>
                            {skill.verified && <div style={{ fontSize: '0.7rem', color: 'var(--green-600)', fontWeight: 700, marginTop: '0.25rem' }}>✓ Verified</div>}
                          </div>
                          <button onClick={() => removeSkill(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '1rem', flexShrink: 0, padding: '0.25rem' }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card">
                <div className="card-header"><span style={{ fontWeight: 700 }}>🔑 Change Password</span></div>
                <form onSubmit={changePassword} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label form-label-req">Current Password</label>
                    <input className="form-input" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label form-label-req">New Password</label>
                    <input className="form-input" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} required minLength={8} />
                    <div className="form-hint">Minimum 8 characters</div>
                  </div>
                  <div>
                    <label className="form-label form-label-req">Confirm New Password</label>
                    <input className="form-input" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} required />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="card card-body">
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)', marginBottom: '0.875rem' }}>🔐 Two-Factor Authentication</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                      {user?.mfa_enabled ? '✅ MFA is enabled on your account.' : 'Protect your account with an authenticator app.'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>Uses TOTP (Google Authenticator, Authy, etc.)</div>
                  </div>
                  <button className={`btn btn-sm ${user?.mfa_enabled ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => toast('MFA setup flow — use POST /auth/mfa/setup', { icon: 'ℹ️' })}>
                    {user?.mfa_enabled ? 'Disable MFA' : 'Enable MFA'}
                  </button>
                </div>
              </div>

              <div className="card card-body" style={{ background: 'var(--red-50)', border: '1px solid #fecaca' }}>
                <div style={{ fontWeight: 700, color: 'var(--red-700)', marginBottom: '0.5rem' }}>⚠️ Danger Zone</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--red-600)', marginBottom: '0.875rem' }}>Permanently delete your account and all associated data. This cannot be undone.</div>
                <button className="btn btn-sm" style={{ background: 'var(--red-600)', color: '#fff', border: 'none' }} onClick={() => toast.error('Please contact support to delete your account')}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {tab === 'certificates' && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 700 }}>🏅 My Certificates</span>
                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{certs.length} earned</span>
              </div>
              <div className="card-body">
                {certsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '10px' }} />)}
                  </div>
                ) : certs.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-icon">🏅</div>
                    <div className="empty-title">No certificates yet</div>
                    <div className="empty-desc">Complete a course to earn your first digital certificate</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {certs.map((cert) => (
                      <div key={cert.certificate_id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'linear-gradient(135deg, #fef3c7, #fffbeb)', borderRadius: '12px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🏅</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: '0.9375rem' }}>{cert.course_title}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>
                            Completed {cert.completed_at ? new Date(cert.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                          </div>
                          <code style={{ fontSize: '0.75rem', color: 'var(--gold-700)', background: 'rgba(0,0,0,0.05)', padding: '0.125rem 0.375rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                            {cert.certificate_id}
                          </code>
                        </div>
                        <a href={`/certificates/verify/${cert.certificate_id}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                          Verify
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontWeight: 700 }}>🔔 Notifications</span>
                {notifications.some(n => !n.is_read) && (
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {notifsLoading ? (
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />)}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem' }}>
                    <div className="empty-icon">🔔</div>
                    <div className="empty-title">No notifications</div>
                  </div>
                ) : (
                  <div>
                    {notifications.map((n) => (
                      <div key={n.id} onClick={() => markNotifRead(n.id)} style={{ display: 'flex', gap: '0.875rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'var(--blue-50)', transition: 'background 0.15s' }}>
                        <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{n.notification_type === 'success' ? '✅' : n.notification_type === 'warning' ? '⚠️' : n.notification_type === 'error' ? '❌' : 'ℹ️'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: n.is_read ? 600 : 800, fontSize: '0.875rem', color: 'var(--gray-900)' }}>{n.title}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{n.message}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                        {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--blue-700)', flexShrink: 0, marginTop: '0.375rem' }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
