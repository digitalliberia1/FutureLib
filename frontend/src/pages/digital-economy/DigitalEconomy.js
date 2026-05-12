import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  border: '1px solid var(--gray-200)', marginBottom: '1rem',
  boxSizing: 'border-box', fontSize: '0.9rem',
};

const TRADE_TYPES = ['export', 'import', 'service', 'remittance', 'fdi'];

const AGREEMENT_COLORS = {
  bilateral: 'badge-blue', multilateral: 'badge-green',
  free_trade: 'badge-yellow', preferential: 'badge-red',
};

const ZONE_TYPE_COLORS = {
  sez: 'badge-blue', ftz: 'badge-green', industrial: 'badge-yellow',
  tech_park: 'badge-red', agri_zone: 'badge-green',
};

function formatVolume(v) {
  if (!v && v !== 0) return '—';
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(1) + 'T';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v;
}

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

export default function DigitalEconomy() {
  const { user } = useSelector(s => s.auth);
  const canRecord = user?.role === 'government_official' || user?.role === 'admin';

  const [overview, setOverview] = useState(null);
  const [partners, setPartners] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners');
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [txCountryFilter, setTxCountryFilter] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({ trade_type: 'export', partner_country: '', amount_usd: '', currency: 'USD', sector: '', description: '' });
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/digital-economy/overview').catch(() => ({ data: null })),
      api.get('/digital-economy/partners').catch(() => ({ data: { results: [] } })),
      api.get('/digital-economy/zones').catch(() => ({ data: { results: [] } })),
    ]).then(([oRes, pRes, zRes]) => {
      setOverview(oRes.data);
      setPartners(pRes.data?.results || pRes.data?.partners || pRes.data || []);
      setZones(zRes.data?.results || zRes.data?.zones || zRes.data || []);
      setLoading(false);
    });
    fetchTransactions(1, '', '');
  }, []);

  const fetchTransactions = async (page, type, country) => {
    setTxLoading(true);
    try {
      const params = { page, page_size: 15 };
      if (type) params.trade_type = type;
      if (country) params.partner_country = country;
      const { data } = await api.get('/digital-economy/transactions', { params });
      setTransactions(data?.results || data?.transactions || data || []);
      setTxTotal(data?.total || data?.count || 0);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const submitTransaction = async () => {
    setSubmitting(true);
    setTxError('');
    try {
      await api.post('/digital-economy/transactions', { ...txForm, amount_usd: parseFloat(txForm.amount_usd) || 0 });
      setTxSuccess(true);
      setTimeout(() => { setShowTxModal(false); setTxSuccess(false); setTxForm({ trade_type: 'export', partner_country: '', amount_usd: '', currency: 'USD', sector: '', description: '' }); fetchTransactions(1, txTypeFilter, txCountryFilter); }, 1500);
    } catch (e) {
      setTxError(e?.response?.data?.detail || 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const txTotalPages = Math.ceil(txTotal / 15);

  const txTypeColors = { export: 'badge-green', import: 'badge-blue', service: 'badge-yellow', remittance: 'badge-red', fdi: 'badge-blue' };

  // Build overview panels
  const byType = overview?.transactions_by_type || {};
  const maxByType = Math.max(1, ...Object.values(byType));
  const topPartners = overview?.top_partners || partners.slice(0, 5);
  const zoneTypes = overview?.zones_by_type || {};

  return (
    <DashboardLayout title="Digital Economy" subtitle="Cross-Border Trade & Economic Zones">
      {/* Hero strip */}
      <div style={{ background: 'linear-gradient(135deg, #1a1200 0%, #3d2800 40%, #1A3A6B 100%)', borderRadius: '16px', padding: '2rem 2.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(251,191,36,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>CROSS-BORDER DIGITAL ECONOMY</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.375rem' }}>💱 Cross-Border Digital Economy</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>Trade, investment and economic zone management for Liberia</p>
        </div>
        {canRecord && (
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-sm" style={{ background: 'var(--gold-400)', color: '#000', fontWeight: 800 }} onClick={() => setShowTxModal(true)}>+ Record Transaction</button>
          </div>
        )}
      </div>

      {/* Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card card-body"><div className="skeleton" style={{ height: '60px' }} /></div>
        )) : [
          { label: 'Trade Partners', value: overview?.total_partners ?? partners.length, color: 'var(--blue-700)', bg: '#eff6ff' },
          { label: 'Trade Volume', value: formatVolume(overview?.total_trade_volume), color: '#ca8a04', bg: '#fefce8' },
          { label: 'Total Transactions', value: (overview?.total_transactions ?? txTotal)?.toLocaleString(), color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Economic Zones', value: overview?.total_zones ?? zones.length, color: '#7c3aed', bg: '#f5f3ff' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Three-column overview panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Trade by Type */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '1rem' }}>📊 Trade by Type</div>
          {Object.keys(byType).length === 0 ? (
            <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No data</div>
          ) : Object.entries(byType).map(([type, amount]) => (
            <div key={type} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--gray-700)' }}>{type}</span>
                <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{formatVolume(amount)}</span>
              </div>
              <div style={{ background: 'var(--gray-100)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((amount / maxByType) * 100)}%`, height: '100%', background: 'var(--blue-700)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Partners */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '1rem' }}>🌍 Top Partners</div>
          {topPartners.length === 0 ? (
            <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No data</div>
          ) : topPartners.slice(0, 5).map((p, i) => (
            <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--blue-800)', background: 'var(--blue-50)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{p.country_code || p.country?.slice(0, 2).toUpperCase()}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{p.country_name || p.country}</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--gray-900)' }}>{formatVolume(p.trade_volume || p.volume)}</span>
            </div>
          ))}
        </div>

        {/* Economic Zones by Type */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '1rem' }}>🏭 Zones by Type</div>
          {Object.keys(zoneTypes).length === 0 ? (
            zones.length === 0 ? (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No data</div>
            ) : (
              [...new Set(zones.map(z => z.zone_type))].map(zt => (
                <div key={zt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)', textTransform: 'uppercase' }}>{zt}</span>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{zones.filter(z => z.zone_type === zt).length}</span>
                </div>
              ))
            )
          ) : Object.entries(zoneTypes).map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-700)', textTransform: 'uppercase' }}>{type}</span>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
        {[{ id: 'partners', label: '🌍 Trade Partners' }, { id: 'transactions', label: '💳 Transactions' }, { id: 'zones', label: '🏭 Economic Zones' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            color: activeTab === t.id ? 'var(--blue-700)' : 'var(--gray-500)',
            borderBottom: activeTab === t.id ? '2px solid var(--blue-700)' : '2px solid transparent', marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />)}
          </div>
        ) : partners.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🌍</div><div className="empty-title">No trade partners</div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {partners.map((p, i) => (
              <div key={p.id || i} className="card card-hover">
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                    <div style={{ background: 'var(--blue-900)', color: '#fff', fontWeight: 900, fontSize: '1rem', padding: '0.5rem 0.75rem', borderRadius: '8px', flexShrink: 0 }}>
                      {p.country_code || p.country?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--gray-900)' }}>{p.country_name || p.country}</div>
                      {p.region && <span className="chip" style={{ fontSize: '0.7rem', marginTop: '0.25rem', display: 'inline-block' }}>{p.region}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>Trade Volume</span>
                    <span style={{ fontWeight: 800, color: 'var(--gray-900)' }}>{formatVolume(p.trade_volume)}</span>
                  </div>
                  {p.agreement_type && (
                    <div style={{ marginBottom: '0.625rem' }}>
                      <span className={`badge ${AGREEMENT_COLORS[p.agreement_type] || 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>{p.agreement_type.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {p.primary_exports?.length > 0 && (
                    <div style={{ marginBottom: '0.375rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 700, marginBottom: '0.25rem' }}>EXPORTS</div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {p.primary_exports.slice(0, 3).map((ex, j) => <span key={j} className="chip" style={{ fontSize: '0.68rem' }}>{ex}</span>)}
                      </div>
                    </div>
                  )}
                  {p.primary_imports?.length > 0 && (
                    <div style={{ marginBottom: '0.375rem' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 700, marginBottom: '0.25rem' }}>IMPORTS</div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {p.primary_imports.slice(0, 3).map((im, j) => <span key={j} className="chip" style={{ fontSize: '0.68rem' }}>{im}</span>)}
                      </div>
                    </div>
                  )}
                  {p.digital_services != null && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                      Digital Services: <strong>{p.digital_services ? '✓' : '✗'}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <select value={txTypeFilter} onChange={e => { setTxTypeFilter(e.target.value); fetchTransactions(1, e.target.value, txCountryFilter); setTxPage(1); }} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem', background: '#fff' }}>
              <option value="">All Types</option>
              {TRADE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <input value={txCountryFilter} onChange={e => setTxCountryFilter(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { fetchTransactions(1, txTypeFilter, txCountryFilter); setTxPage(1); } }} placeholder="Partner country..." style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem' }} />
            <button className="btn btn-outline btn-sm" onClick={() => { fetchTransactions(1, txTypeFilter, txCountryFilter); setTxPage(1); }}>Search</button>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                    {['Type', 'Partner Country', 'Amount', 'Sector', 'Description', 'Processed By', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-600)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '0.75rem 1rem' }}><div className="skeleton" style={{ height: '20px' }} /></td></tr>
                  )) : transactions.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No transactions found</td></tr>
                  ) : transactions.map((tx, i) => (
                    <tr key={tx.id || i} style={{ borderBottom: '1px solid var(--gray-100)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${txTypeColors[tx.trade_type || tx.type] || 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>{tx.trade_type || tx.type}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--gray-900)' }}>{tx.partner_country}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--gray-900)' }}>{formatVolume(tx.amount_usd)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {tx.sector && <span className="chip" style={{ fontSize: '0.72rem' }}>{tx.sector}</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-600)', maxWidth: '200px' }}>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tx.description}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-500)', fontSize: '0.8125rem' }}>{tx.processed_by || tx.created_by || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--gray-400)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {txTotalPages > 1 && (
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid var(--gray-100)' }}>
                <button className="btn btn-outline btn-sm" disabled={txPage === 1} onClick={() => { setTxPage(p => p - 1); fetchTransactions(txPage - 1, txTypeFilter, txCountryFilter); }}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>Page {txPage} of {txTotalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={txPage === txTotalPages} onClick={() => { setTxPage(p => p + 1); fetchTransactions(txPage + 1, txTypeFilter, txCountryFilter); }}>Next →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Economic Zones Tab */}
      {activeTab === 'zones' && (
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.25rem' }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '12px' }} />)}
          </div>
        ) : zones.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏭</div><div className="empty-title">No economic zones</div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.25rem' }}>
            {zones.map((zone, i) => (
              <div key={zone.id || i} className="card card-hover">
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {zone.zone_type && <span className={`badge ${ZONE_TYPE_COLORS[zone.zone_type] || 'badge-blue'}`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{zone.zone_type}</span>}
                    {zone.status && <span className={`badge ${zone.status === 'active' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.7rem' }}>{zone.status}</span>}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gray-900)', marginBottom: '0.25rem' }}>{zone.name}</h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>{zone.location}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.625rem', marginBottom: '0.75rem' }}>
                    {[
                      { label: 'Area', value: zone.area_km2 != null ? zone.area_km2 + ' km²' : '—' },
                      { label: 'Companies', value: zone.companies_count ?? zone.companies ?? '—' },
                      { label: 'Employees', value: zone.employees_count != null ? zone.employees_count.toLocaleString() : '—' },
                      { label: 'Revenue', value: zone.annual_revenue_usd != null ? '$' + (zone.annual_revenue_usd / 1e6).toFixed(1) + 'M' : '—' },
                    ].map(d => (
                      <div key={d.label} style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{d.label}</div>
                        <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--gray-900)' }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                  {zone.incentives?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {zone.incentives.map((inc, j) => <span key={j} className="chip" style={{ fontSize: '0.7rem' }}>{inc}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Record Transaction Modal */}
      {showTxModal && (
        <Modal title="💳 Record Transaction" onClose={() => { setShowTxModal(false); setTxError(''); setTxSuccess(false); }}>
          {txSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Transaction recorded successfully!</div>}
          {txError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{txError}</div>}
          <select style={inputStyle} value={txForm.trade_type} onChange={e => setTxForm(f => ({ ...f, trade_type: e.target.value }))}>
            {TRADE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <input style={inputStyle} placeholder="Partner Country *" value={txForm.partner_country} onChange={e => setTxForm(f => ({ ...f, partner_country: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <input style={inputStyle} placeholder="Amount (USD) *" type="number" min="0" value={txForm.amount_usd} onChange={e => setTxForm(f => ({ ...f, amount_usd: e.target.value }))} />
            <input style={inputStyle} placeholder="Currency" value={txForm.currency} onChange={e => setTxForm(f => ({ ...f, currency: e.target.value }))} />
          </div>
          <input style={inputStyle} placeholder="Sector" value={txForm.sector} onChange={e => setTxForm(f => ({ ...f, sector: e.target.value }))} />
          <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Description..." value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowTxModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitTransaction} disabled={submitting || !txForm.partner_country || !txForm.amount_usd}>{submitting ? 'Recording...' : 'Record Transaction'}</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
