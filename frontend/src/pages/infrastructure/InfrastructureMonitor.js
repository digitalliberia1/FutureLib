import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const relTime = (dt) => {
  if (!dt) return '—';
  const s = Math.floor((Date.now() - new Date(dt)) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  return Math.floor(s / 3600) + 'h ago';
};

const STATUS_COLORS = {
  online: { bg: '#f0fdf4', color: '#16a34a', badge: 'badge-green' },
  degraded: { bg: '#fefce8', color: '#ca8a04', badge: 'badge-yellow' },
  offline: { bg: '#fef2f2', color: '#dc2626', badge: 'badge-red' },
  maintenance: { bg: '#eff6ff', color: '#2563eb', badge: 'badge-blue' },
  unknown: { bg: '#f9fafb', color: '#6b7280', badge: '' },
};

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  border: '1px solid var(--gray-200)', marginBottom: '1rem',
  boxSizing: 'border-box', fontSize: '0.9rem',
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
      {status || 'unknown'}
    </span>
  );
}

export default function InfrastructureMonitor() {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeMetrics, setNodeMetrics] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchHealth = async () => {
    try {
      const { data } = await api.get('/infrastructure/health');
      setHealth(data?.services || data?.results || data || []);
    } catch {
      /* ignore */
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/infrastructure/overview').catch(() => ({ data: null })),
      api.get('/infrastructure/nodes', { params: { page_size: 50 } }).catch(() => ({ data: { results: [] } })),
    ]).then(([oRes, nRes]) => {
      setOverview(oRes.data);
      setNodes(nRes.data?.results || nRes.data?.nodes || nRes.data || []);
      setLoading(false);
    });
    fetchHealth();
    intervalRef.current = setInterval(fetchHealth, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchNodeMetrics = async (node) => {
    setSelectedNode(node);
    setMetricsLoading(true);
    try {
      const { data } = await api.get(`/infrastructure/nodes/${node.id}/metrics`, { params: { limit: 10 } });
      setNodeMetrics(data?.results || data?.metrics || data || []);
    } catch {
      setNodeMetrics([]);
    } finally {
      setMetricsLoading(false);
    }
  };

  const allOffline = !loading && overview && overview.offline > 0;
  const allOnline = !loading && overview && overview.offline === 0 && overview.degraded === 0;

  const regions = [...new Set(nodes.map(n => n.region).filter(Boolean))];
  const filteredNodes = nodes.filter(n => {
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
    if (regionFilter && n.region !== regionFilter) return false;
    return true;
  });

  return (
    <DashboardLayout title="Infrastructure Monitor" subtitle="National Digital Infrastructure Status">
      {/* Status Banner */}
      {!loading && (
        <div style={{
          background: allOnline ? '#f0fdf4' : allOffline ? '#fef2f2' : '#fefce8',
          border: `1px solid ${allOnline ? '#86efac' : allOffline ? '#fca5a5' : '#fde047'}`,
          color: allOnline ? '#15803d' : allOffline ? '#dc2626' : '#a16207',
          borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem',
          fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          {allOnline ? '✓ All Systems Operational' : allOffline ? '⚠️ Infrastructure Degradation Detected' : '⚠️ Some Services Degraded'}
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card card-body"><div className="skeleton" style={{ height: '60px' }} /></div>
        )) : [
          { label: 'Total Nodes', value: overview?.total_nodes ?? nodes.length, color: 'var(--blue-700)', bg: '#eff6ff' },
          { label: 'Online', value: overview?.online ?? nodes.filter(n => n.status === 'online').length, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Degraded', value: overview?.degraded ?? nodes.filter(n => n.status === 'degraded').length, color: '#ca8a04', bg: '#fefce8' },
          { label: 'Offline', value: overview?.offline ?? nodes.filter(n => n.status === 'offline').length, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Avg Uptime %', value: overview?.avg_uptime != null ? overview.avg_uptime.toFixed(1) + '%' : '—', color: 'var(--blue-700)', bg: '#eff6ff' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '12px', padding: '1.125rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Service Health Cards */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', marginBottom: '1.75rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>🔄 Service Health</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Auto-refreshes every 30s</span>
        </div>
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '0.875rem' }}>
          {healthLoading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '96px', borderRadius: '10px' }} />
          )) : health.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🔄</div><div className="empty-title">No service data</div>
            </div>
          ) : health.map((svc, i) => {
            const sc = STATUS_COLORS[svc.status] || STATUS_COLORS.unknown;
            const upPct = svc.uptime_24h ?? 100;
            return (
              <div key={svc.id || i} style={{ border: `1px solid ${sc.color}33`, borderRadius: '10px', padding: '1rem', background: sc.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-900)' }}>{svc.name || svc.service_name}</div>
                  <StatusBadge status={svc.status} />
                </div>
                {svc.endpoint && (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.endpoint}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.375rem' }}>
                  <span>{svc.response_time != null ? svc.response_time + 'ms' : ''}</span>
                  <span style={{ fontWeight: 700 }}>{upPct.toFixed(1)}% uptime</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${upPct}%`, height: '100%', background: sc.color, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nodes Table + Drawer */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '0.875rem' }}>🖥️ Infrastructure Nodes</div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {['all', 'online', 'degraded', 'offline', 'maintenance'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gray-200)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                    background: statusFilter === s ? 'var(--blue-700)' : '#fff',
                    color: statusFilter === s ? '#fff' : 'var(--gray-600)',
                  }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              {regions.length > 0 && (
                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.8125rem', color: 'var(--gray-700)', background: '#fff' }}>
                  <option value="">All Regions</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['Name', 'Type', 'Region', 'Status', 'Uptime %', 'Last Checked'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '20px' }} /></td></tr>
                )) : filteredNodes.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No nodes match filters</td></tr>
                ) : filteredNodes.map((node, i) => (
                  <tr key={node.id || i} onClick={() => fetchNodeMetrics(node)} style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', background: selectedNode?.id === node.id ? 'var(--blue-50)' : 'transparent' }}
                    onMouseEnter={e => { if (selectedNode?.id !== node.id) e.currentTarget.style.background = 'var(--gray-50)'; }}
                    onMouseLeave={e => { if (selectedNode?.id !== node.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--gray-900)' }}>{node.name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)' }}>{node.node_type || node.type}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)' }}>{node.region || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={node.status} /></td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{node.uptime_percent != null ? node.uptime_percent.toFixed(1) + '%' : '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-400)', fontSize: '0.8125rem' }}>{relTime(node.last_checked)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Node Detail Drawer */}
        {selectedNode && (
          <div style={{ width: '380px', flexShrink: 0, background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ padding: '1.125rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{selectedNode.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{selectedNode.node_type || selectedNode.type} • {selectedNode.region}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', color: 'var(--gray-400)', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Status', value: <StatusBadge status={selectedNode.status} /> },
                  { label: 'Uptime', value: selectedNode.uptime_percent != null ? selectedNode.uptime_percent.toFixed(1) + '%' : '—' },
                  { label: 'IP Address', value: selectedNode.ip_address || '—' },
                  { label: 'Last Checked', value: relTime(selectedNode.last_checked) },
                ].map(d => (
                  <div key={d.label} style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '0.625rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{d.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-900)' }}>{d.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.625rem' }}>Recent Metrics</div>
              {metricsLoading ? (
                <div className="skeleton" style={{ height: '120px', borderRadius: '8px' }} />
              ) : nodeMetrics.length === 0 ? (
                <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>No metrics available</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        {['CPU%', 'Mem%', 'Disk%', 'Net In', 'Net Out', 'Resp ms', 'Time'].map(h => (
                          <th key={h} style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodeMetrics.map((m, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '0.375rem 0.5rem', color: m.cpu_percent > 80 ? '#ef4444' : 'var(--gray-700)' }}>{m.cpu_percent?.toFixed(1) ?? '—'}</td>
                          <td style={{ padding: '0.375rem 0.5rem', color: m.memory_percent > 80 ? '#f97316' : 'var(--gray-700)' }}>{m.memory_percent?.toFixed(1) ?? '—'}</td>
                          <td style={{ padding: '0.375rem 0.5rem' }}>{m.disk_percent?.toFixed(1) ?? '—'}</td>
                          <td style={{ padding: '0.375rem 0.5rem' }}>{m.network_in != null ? (m.network_in / 1024).toFixed(0) + 'K' : '—'}</td>
                          <td style={{ padding: '0.375rem 0.5rem' }}>{m.network_out != null ? (m.network_out / 1024).toFixed(0) + 'K' : '—'}</td>
                          <td style={{ padding: '0.375rem 0.5rem' }}>{m.response_time ?? '—'}</td>
                          <td style={{ padding: '0.375rem 0.5rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{relTime(m.recorded_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
