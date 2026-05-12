import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const DEVICE_ICONS = {
  sensor: '🌡️', camera: '📷', traffic_light: '🚦', weather: '🌤️',
  water_meter: '💧', smart_light: '💡', air_quality: '🌫️', noise: '🔊',
  flood: '🌊', solar: '☀️',
};

const STATUS_COLORS = {
  planning: { bg: '#f9fafb', color: '#6b7280' },
  approved: { bg: '#eff6ff', color: '#2563eb' },
  in_progress: { bg: '#fefce8', color: '#ca8a04' },
  completed: { bg: '#f0fdf4', color: '#16a34a' },
  on_hold: { bg: '#fef2f2', color: '#dc2626' },
};

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  border: '1px solid var(--gray-200)', marginBottom: '1rem',
  boxSizing: 'border-box', fontSize: '0.9rem',
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

function formatBudget(amt) {
  if (!amt && amt !== 0) return '—';
  if (amt >= 1e9) return '$' + (amt / 1e9).toFixed(1) + 'B';
  if (amt >= 1e6) return '$' + (amt / 1e6).toFixed(1) + 'M';
  if (amt >= 1e3) return '$' + (amt / 1e3).toFixed(0) + 'K';
  return '$' + amt;
}

export default function SmartCities() {
  const { user } = useSelector(s => s.auth);
  const isAdmin = user?.role === 'admin';
  const isOfficial = user?.role === 'government_official' || isAdmin;

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: '', city: '', budget_usd: '', start_date: '', end_date: '', lead_agency: '', partners: '' });
  const [deviceForm, setDeviceForm] = useState({ name: '', device_type: 'sensor', location: '', lat: '', lng: '', project_id: '' });
  const [projectSuccess, setProjectSuccess] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [deviceSuccess, setDeviceSuccess] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/smart-city/stats').catch(() => ({ data: null })),
      api.get('/smart-city/projects').catch(() => ({ data: { results: [] } })),
      api.get('/smart-city/devices').catch(() => ({ data: { results: [] } })),
    ]).then(([sRes, pRes, dRes]) => {
      setStats(sRes.data);
      setProjects(pRes.data?.results || pRes.data?.projects || pRes.data || []);
      setDevices(dRes.data?.results || dRes.data?.devices || dRes.data || []);
      setLoading(false);
    });
  }, []);

  const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
  const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];
  const deviceTypes = [...new Set(devices.map(d => d.device_type).filter(Boolean))];

  const filteredProjects = projects.filter(p => {
    if (catFilter && p.category !== catFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const filteredDevices = devices.filter(d => {
    if (deviceTypeFilter && d.device_type !== deviceTypeFilter) return false;
    if (onlineOnly && !d.is_online) return false;
    return true;
  });

  const submitProject = async () => {
    setSubmitting(true);
    setProjectError('');
    try {
      const payload = {
        ...projectForm,
        budget_usd: parseFloat(projectForm.budget_usd) || 0,
        partners: projectForm.partners.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/smart-city/projects', payload);
      setProjectSuccess(true);
      setTimeout(() => { setShowProjectModal(false); setProjectSuccess(false); setProjectForm({ title: '', description: '', category: '', city: '', budget_usd: '', start_date: '', end_date: '', lead_agency: '', partners: '' }); }, 1500);
    } catch (e) {
      setProjectError(e?.response?.data?.detail || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDevice = async () => {
    setSubmitting(true);
    setDeviceError('');
    try {
      const payload = { ...deviceForm };
      if (payload.lat) payload.lat = parseFloat(payload.lat);
      if (payload.lng) payload.lng = parseFloat(payload.lng);
      if (!payload.lat) delete payload.lat;
      if (!payload.lng) delete payload.lng;
      if (!payload.project_id) delete payload.project_id;
      await api.post('/smart-city/devices', payload);
      setDeviceSuccess(true);
      setTimeout(() => { setShowDeviceModal(false); setDeviceSuccess(false); setDeviceForm({ name: '', device_type: 'sensor', location: '', lat: '', lng: '', project_id: '' }); }, 1500);
    } catch (e) {
      setDeviceError(e?.response?.data?.detail || 'Failed to register device.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Smart Cities" subtitle="Liberia Smart Nation Initiative">
      {/* Hero strip */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e3a5f 100%)', borderRadius: '16px', padding: '2rem 2.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(110,231,183,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>SMART NATION INITIATIVE</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.375rem' }}>🏙️ Smart Liberia</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>Building intelligent, connected communities across Liberia</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          {isOfficial && (
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setShowProjectModal(true)}>+ Create Project</button>
          )}
          {isAdmin && (
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => setShowDeviceModal(true)}>+ Register Device</button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card card-body"><div className="skeleton" style={{ height: '60px' }} /></div>
        )) : [
          { label: 'Total Projects', value: stats?.total_projects ?? projects.length, color: 'var(--gray-700)', bg: '#f9fafb' },
          { label: 'In Progress', value: stats?.in_progress ?? projects.filter(p => p.status === 'in_progress').length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Completed', value: stats?.completed ?? projects.filter(p => p.status === 'completed').length, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'IoT Devices', value: stats?.total_devices ?? devices.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Online Devices', value: stats?.online_devices ?? devices.filter(d => d.is_online).length, color: '#16a34a', bg: '#f0fdf4' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '12px', padding: '1.125rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
        {[{ id: 'projects', label: '🏗️ Projects' }, { id: 'devices', label: '📡 IoT Devices' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === t.id ? 'var(--blue-700)' : 'var(--gray-500)',
            borderBottom: activeTab === t.id ? '2px solid var(--blue-700)' : '2px solid transparent', marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginLeft: 'auto' }}>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />)}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🏗️</div><div className="empty-title">No projects found</div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
              {filteredProjects.map((proj, i) => {
                const sc = STATUS_COLORS[proj.status] || STATUS_COLORS.planning;
                const prog = proj.completion_percent ?? proj.progress ?? 0;
                return (
                  <div key={proj.id || i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-body" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {proj.category && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{proj.category}</span>}
                        <span style={{ background: sc.bg, color: sc.color, padding: '0.1rem 0.5rem', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700 }}>{(proj.status || 'planning').replace(/_/g, ' ')}</span>
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '0.375rem', lineHeight: 1.35 }}>{proj.title}</h3>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>{proj.city}</div>
                      {proj.lead_agency && <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Lead: <strong>{proj.lead_agency}</strong></div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.625rem' }}>
                        <span style={{ color: 'var(--gray-500)' }}>Budget</span>
                        <span style={{ fontWeight: 800, color: 'var(--gray-900)' }}>{formatBudget(proj.budget_usd)}</span>
                      </div>
                      <div style={{ marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                          <span>Progress</span><span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{prog}%</span>
                        </div>
                        <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${prog}%`, height: '100%', background: 'var(--blue-700)', borderRadius: '4px' }} />
                        </div>
                      </div>
                      {proj.partners?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {proj.partners.slice(0, 3).map((p, j) => (
                            <span key={j} className="chip" style={{ fontSize: '0.7rem' }}>{p}</span>
                          ))}
                          {proj.partners.length > 3 && <span className="chip" style={{ fontSize: '0.7rem' }}>+{proj.partners.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* IoT Devices Tab */}
      {activeTab === 'devices' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={deviceTypeFilter} onChange={e => setDeviceTypeFilter(e.target.value)} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Types</option>
              {deviceTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)} />
              Online Only
            </label>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginLeft: 'auto' }}>{filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />)}
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📡</div><div className="empty-title">No devices found</div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
              {filteredDevices.map((dev, i) => (
                <div key={dev.id || i} className="card card-body card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>{DEVICE_ICONS[dev.device_type] || '📡'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dev.is_online ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: dev.is_online ? '#16a34a' : '#dc2626' }}>{dev.is_online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-900)', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{dev.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>{dev.location}</div>
                  {dev.battery_percent != null && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.375rem' }}>🔋 {dev.battery_percent}%</div>
                  )}
                  {dev.last_reading && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontFamily: 'monospace', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {typeof dev.last_reading === 'object' ? JSON.stringify(dev.last_reading).slice(0, 60) : String(dev.last_reading).slice(0, 60)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <Modal title="🏗️ Create Smart City Project" onClose={() => { setShowProjectModal(false); setProjectError(''); setProjectSuccess(false); }}>
          {projectSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Project created successfully!</div>}
          {projectError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{projectError}</div>}
          <input style={inputStyle} placeholder="Project Title *" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Description..." value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} />
          <select style={inputStyle} value={projectForm.category} onChange={e => setProjectForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">Select Category</option>
            {['transport', 'energy', 'water', 'healthcare', 'education', 'agriculture', 'waste_management', 'public_safety', 'connectivity'].map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <input style={inputStyle} placeholder="City *" value={projectForm.city} onChange={e => setProjectForm(f => ({ ...f, city: e.target.value }))} />
          <input style={inputStyle} placeholder="Budget (USD)" type="number" value={projectForm.budget_usd} onChange={e => setProjectForm(f => ({ ...f, budget_usd: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input style={inputStyle} placeholder="Start Date" type="date" value={projectForm.start_date} onChange={e => setProjectForm(f => ({ ...f, start_date: e.target.value }))} />
            <input style={inputStyle} placeholder="End Date" type="date" value={projectForm.end_date} onChange={e => setProjectForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <input style={inputStyle} placeholder="Lead Agency" value={projectForm.lead_agency} onChange={e => setProjectForm(f => ({ ...f, lead_agency: e.target.value }))} />
          <input style={inputStyle} placeholder="Partners (comma-separated)" value={projectForm.partners} onChange={e => setProjectForm(f => ({ ...f, partners: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowProjectModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitProject} disabled={submitting || !projectForm.title}>{submitting ? 'Creating...' : 'Create Project'}</button>
          </div>
        </Modal>
      )}

      {/* Register Device Modal */}
      {showDeviceModal && (
        <Modal title="📡 Register IoT Device" onClose={() => { setShowDeviceModal(false); setDeviceError(''); setDeviceSuccess(false); }}>
          {deviceSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Device registered successfully!</div>}
          {deviceError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{deviceError}</div>}
          <input style={inputStyle} placeholder="Device Name *" value={deviceForm.name} onChange={e => setDeviceForm(f => ({ ...f, name: e.target.value }))} />
          <select style={inputStyle} value={deviceForm.device_type} onChange={e => setDeviceForm(f => ({ ...f, device_type: e.target.value }))}>
            {Object.keys(DEVICE_ICONS).map(t => (
              <option key={t} value={t}>{DEVICE_ICONS[t]} {t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
          <input style={inputStyle} placeholder="Location *" value={deviceForm.location} onChange={e => setDeviceForm(f => ({ ...f, location: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input style={inputStyle} placeholder="Latitude (optional)" type="number" step="any" value={deviceForm.lat} onChange={e => setDeviceForm(f => ({ ...f, lat: e.target.value }))} />
            <input style={inputStyle} placeholder="Longitude (optional)" type="number" step="any" value={deviceForm.lng} onChange={e => setDeviceForm(f => ({ ...f, lng: e.target.value }))} />
          </div>
          <input style={inputStyle} placeholder="Project ID (optional)" value={deviceForm.project_id} onChange={e => setDeviceForm(f => ({ ...f, project_id: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowDeviceModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitDevice} disabled={submitting || !deviceForm.name}>{submitting ? 'Registering...' : 'Register Device'}</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
