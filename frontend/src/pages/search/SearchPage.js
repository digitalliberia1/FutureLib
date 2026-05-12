import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

const TYPES = ['all', 'courses', 'jobs', 'startups', 'services'];

const TYPE_ICONS = { course: '📚', job: '💼', startup: '🚀', service: '🏛️' };
const TYPE_LABELS = { courses: '📚 Courses', jobs: '💼 Jobs', startups: '🚀 Startups', services: '🏛️ Services' };

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q, activeType, 1); }
  }, []);

  const doSearch = async (q, type, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const params = { q, page: p, page_size: 12 };
      if (type && type !== 'all') params.type = type;
      const { data } = await api.get('/search/', { params });
      setResults(data.results || []);
      setTotal(data.total || 0);
      setTypeCounts(data.type_counts || {});
      setPage(p);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query, type: activeType });
    doSearch(query, activeType, 1);
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    if (query.trim()) {
      setSearchParams({ q: query, type });
      doSearch(query, type, 1);
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Search hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', padding: '3rem 1.25rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>FutureLib Search</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>Find Anything on FutureLib</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem' }}>Search across courses, jobs, startups and government services</p>
          </div>

          <form onSubmit={handleSearch} style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.125rem', pointerEvents: 'none' }}>🔍</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search courses, jobs, startups, services..."
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', backdropFilter: 'blur(8px)', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-400)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                />
              </div>
              <button type="submit" className="btn btn-lg" style={{ background: 'var(--gold-400)', color: '#000', fontWeight: 800, borderRadius: '12px', flexShrink: 0 }}>Search</button>
            </div>
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem', flex: 1 }}>
        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--gray-200)', marginBottom: '1.75rem' }}>
          {TYPES.map(type => {
            const count = type === 'all' ? total : (typeCounts[type] || 0);
            return (
              <button key={type} onClick={() => handleTypeChange(type)} style={{
                padding: '0.625rem 1.125rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', textTransform: 'capitalize', transition: 'all 0.15s',
                color: activeType === type ? 'var(--blue-700)' : 'var(--gray-500)',
                borderBottom: activeType === type ? '2px solid var(--blue-700)' : '2px solid transparent',
                marginBottom: '-1px',
              }}>
                {type === 'all' ? 'All' : TYPE_LABELS[type]} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card card-body">
                <div className="skeleton" style={{ height: '14px', width: '30%', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: '18px', marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: '14px', width: '75%' }} />
              </div>
            ))}
          </div>
        ) : !query.trim() ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Start searching</div>
            <div className="empty-desc">Enter a term above to search across all of FutureLib</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.75rem' }}>
              {['Python', 'Remote jobs', 'FinTech startup', 'Business License'].map(term => (
                <button key={term} className="chip" onClick={() => { setQuery(term); doSearch(term, activeType, 1); setSearchParams({ q: term, type: activeType }); }}>
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No results for "{query}"</div>
            <div className="empty-desc">Try different keywords or browse specific sections</div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
              {total} result{total !== 1 ? 's' : ''} for <span style={{ color: 'var(--blue-700)' }}>"{query}"</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {results.map((result, i) => (
                <Link key={i} to={result.url} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-body" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span className={`badge ${result.badge_color}`} style={{ fontSize: '0.7rem' }}>{result.badge}</span>
                        <span style={{ fontSize: '1.125rem' }}>{TYPE_ICONS[result.type]}</span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-900)', marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {result.title}
                      </h3>
                      {result.description && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {result.description}
                        </p>
                      )}
                    </div>
                    {result.meta && (
                      <div className="card-footer" style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                        {result.meta}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => doSearch(query, activeType, page - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => doSearch(query, activeType, page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
