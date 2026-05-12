import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { listCourses, normaliseCourse } from '../../services/openedxApi';

const LEVELS = ['all', 'beginner', 'intermediate', 'advanced'];
const CATEGORY_ICONS = {
  Programming: '💻', 'AI & Machine Learning': '🤖', Cybersecurity: '🛡️',
  Networking: '🌐', 'UI/UX Design': '🎨', 'Data Science': '📊',
  'E-commerce': '🛒', 'Digital Marketing': '📣', Entrepreneurship: '🚀',
  'Financial Literacy': '💰', 'Agriculture Technology': '🌾', 'Cloud Computing': '☁️',
};
const PAGE_SIZE = 12;

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [level, setLevel] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCourses({ page, pageSize: PAGE_SIZE, search: search || undefined });
      const results = (data.results || data.courses || []).map(normaliseCourse);
      setCourses(results);
      setTotal(data.count || data.total || results.length);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filteredCourses = level
    ? courses.filter(c => c.level?.toLowerCase() === level)
    : courses;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', color: '#fff', padding: '3.5rem 1.25rem 2.5rem' }}>
        <div className="container">
          <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Powered by Open edX</div>
          <h1 className="heading-display" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.75rem' }}>Digital Skills Courses</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', maxWidth: '520px' }}>
            Government-certified courses taught by expert instructors. Earn national digital certificates recognized across Liberia.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', maxWidth: '520px' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search courses…"
              style={{
                flex: 1, padding: '0.625rem 1rem', borderRadius: '8px',
                border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '0.9375rem', outline: 'none',
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.625rem 1.25rem', whiteSpace: 'nowrap' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.75rem' }}>
            {[[String(total || '200+'), 'Courses'], ['Free', 'Most courses'], ['🏅', 'Certificates']].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: 'var(--gold-400)', fontWeight: 900, fontSize: '1.25rem' }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.25rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Sidebar filters */}
          <aside style={{ position: 'sticky', top: '80px' }}>
            <div className="card card-body">
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.625rem' }}>Level</div>
                  {LEVELS.map(l => (
                    <button key={l} onClick={() => { setLevel(l === 'all' ? '' : l); setPage(1); }} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.375rem 0.5rem',
                      border: 'none', background: level === (l === 'all' ? '' : l) ? 'var(--blue-50)' : 'none',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem',
                      fontWeight: level === (l === 'all' ? '' : l) ? 700 : 400,
                      color: level === (l === 'all' ? '' : l) ? 'var(--blue-700)' : 'var(--gray-600)', textAlign: 'left',
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: level === (l === 'all' ? '' : l) ? 'var(--blue-700)' : 'var(--gray-300)', flexShrink: 0 }} />
                      {l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.625rem' }}>Category</div>
                  {Object.keys(CATEGORY_ICONS).map(c => (
                    <button key={c} onClick={() => { setSearch(c); setSearchInput(c); setPage(1); }} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.325rem 0.5rem',
                      border: 'none', background: search === c ? 'var(--blue-50)' : 'none',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem',
                      color: search === c ? 'var(--blue-700)' : 'var(--gray-600)',
                      fontWeight: search === c ? 700 : 400, textAlign: 'left',
                    }}>
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Open edX badge */}
            <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--blue-50)', borderRadius: '10px', border: '1px solid var(--blue-100)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--blue-700)', marginBottom: '0.25rem' }}>Learning Engine</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--blue-600)', fontWeight: 600 }}>Open edX Platform</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>via Tutor · Kubernetes</div>
            </div>
          </aside>

          {/* Course grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>
                {loading ? 'Loading…' : `${total} course${total !== 1 ? 's' : ''} found`}
                {search && <span style={{ fontWeight: 400, color: 'var(--gray-400)', marginLeft: '0.5rem' }}>for "{search}"</span>}
              </div>
              {(search || level) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSearchInput(''); setLevel(''); setPage(1); }}>
                  ✕ Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card">
                    <div className="skeleton" style={{ height: '160px' }} />
                    <div className="card-body">
                      <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '0.75rem' }} />
                      <div className="skeleton" style={{ height: '20px', marginBottom: '0.5rem' }} />
                      <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <div className="empty-title">No courses found</div>
                <div className="empty-desc">Try adjusting your search or browse all categories</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setSearch(''); setSearchInput(''); setLevel(''); }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {filteredCourses.map(course => <CourseCard key={course.id} course={course} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                  Page {page} of {totalPages}
                </span>
                <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function CourseCard({ course }) {
  const levelColors = { beginner: 'badge-green', intermediate: 'badge-blue', advanced: 'badge-red' };
  const levelDots = { beginner: '🟢', intermediate: '🔵', advanced: '🔴' };
  const lvl = course.level?.toLowerCase() || 'beginner';
  return (
    <Link to={`/learn/${encodeURIComponent(course.id)}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover" style={{ height: '100%' }}>
        <div style={{
          height: '148px', background: course.thumbnail_url
            ? `url(${course.thumbnail_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', position: 'relative', overflow: 'hidden',
        }}>
          {!course.thumbnail_url && (CATEGORY_ICONS[course.category] || '📚')}
          {course.is_free && (
            <span className="badge" style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', background: 'rgba(5,150,105,0.9)', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
              FREE
            </span>
          )}
          {course.pacing === 'self' && (
            <span className="badge" style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', background: 'rgba(99,102,241,0.9)', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
              Self-Paced
            </span>
          )}
        </div>
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
            <span className={`badge ${levelColors[lvl] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
              {levelDots[lvl] || '⚪'} {lvl}
            </span>
            {course.category && (
              <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                {CATEGORY_ICONS[course.category] || ''} {course.category}
              </span>
            )}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--gray-900)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {course.title}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
            {course.short_description || course.description}
          </p>
          {course.instructor_name && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
              By <strong style={{ color: 'var(--gray-600)' }}>{course.instructor_name}</strong>
            </div>
          )}
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: course.is_free ? 'var(--green-600)' : 'var(--gray-900)', fontSize: '1.0625rem' }}>
            {course.is_free ? 'FREE' : `$${course.price}`}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
            {course.enrolled_count > 0 && <span>👥 {course.enrolled_count?.toLocaleString()}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
