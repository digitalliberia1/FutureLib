import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

const CATEGORIES = ['All', 'Programming', 'AI & Machine Learning', 'Cybersecurity', 'Networking', 'UI/UX Design', 'Data Science', 'E-commerce', 'Digital Marketing', 'Entrepreneurship', 'Financial Literacy', 'Agriculture Technology', 'Cloud Computing'];
const LEVELS = ['all', 'beginner', 'intermediate', 'advanced'];
const CATEGORY_ICONS = { 'Programming': '💻', 'AI & Machine Learning': '🤖', 'Cybersecurity': '🛡️', 'Networking': '🌐', 'UI/UX Design': '🎨', 'Data Science': '📊', 'E-commerce': '🛒', 'Digital Marketing': '📣', 'Entrepreneurship': '🚀', 'Financial Literacy': '💰', 'Agriculture Technology': '🌾', 'Cloud Computing': '☁️' };

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isGov, setIsGov] = useState(false);

  useEffect(() => { fetchCourses(); }, [page, category, level, isFree, isGov]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 12 };
      if (category) params.category = category;
      if (level) params.level = level;
      if (isFree) params.is_free = true;
      if (isGov) params.is_government_sponsored = true;
      const { data } = await api.get('/learning/courses', { params });
      setCourses(data.courses || []); setTotal(data.total || 0);
    } catch { setCourses([]); } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', color: '#fff', padding: '3.5rem 1.25rem 2.5rem' }}>
        <div className="container">
          <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>National Learning Platform</div>
          <h1 className="heading-display" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.75rem' }}>Digital Skills Courses</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', maxWidth: '520px' }}>
            Government-certified courses taught by expert instructors. Earn national digital certificates recognized across Liberia.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            {[['200+', 'Courses'], ['Free', 'Most courses'], ['🏅', 'Certificates']].map(([v, l]) => (
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
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: level === (l === 'all' ? '' : l) ? 700 : 400,
                      color: level === (l === 'all' ? '' : l) ? 'var(--blue-700)' : 'var(--gray-600)', textAlign: 'left',
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: level === (l === 'all' ? '' : l) ? 'var(--blue-700)' : 'var(--gray-300)', flexShrink: 0 }} />
                      {l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.625rem' }}>Price</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.375rem' }}>
                    <input type="checkbox" checked={isFree} onChange={e => { setIsFree(e.target.checked); setPage(1); }} style={{ accentColor: 'var(--blue-700)' }} />
                    Free courses only
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    <input type="checkbox" checked={isGov} onChange={e => { setIsGov(e.target.checked); setPage(1); }} style={{ accentColor: 'var(--blue-700)' }} />
                    Gov. sponsored
                  </label>
                </div>
                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.625rem' }}>Category</div>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => { setCategory(c === 'All' ? '' : c); setPage(1); }} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.325rem 0.5rem',
                      border: 'none', background: category === (c === 'All' ? '' : c) ? 'var(--blue-50)' : 'none',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem',
                      color: category === (c === 'All' ? '' : c) ? 'var(--blue-700)' : 'var(--gray-600)',
                      fontWeight: category === (c === 'All' ? '' : c) ? 700 : 400, textAlign: 'left',
                    }}>
                      {CATEGORY_ICONS[c] || '📁'} {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Course grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>
                {loading ? 'Loading...' : `${total} course${total !== 1 ? 's' : ''} found`}
              </div>
              {(category || level || isFree || isGov) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setCategory(''); setLevel(''); setIsFree(false); setIsGov(false); setPage(1); }}>
                  ✕ Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card"><div className="skeleton" style={{ height: '160px' }} /><div className="card-body"><div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '0.75rem' }} /><div className="skeleton" style={{ height: '20px', marginBottom: '0.5rem' }} /><div className="skeleton" style={{ height: '14px', width: '40%' }} /></div></div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <div className="empty-title">No courses found</div>
                <div className="empty-desc">Try adjusting your filters or browse all categories</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setCategory(''); setLevel(''); setIsFree(false); setIsGov(false); }}>Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {courses.map(course => <CourseCard key={course.id} course={course} />)}
              </div>
            )}

            {Math.ceil(total / 12) > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>Page {page} of {Math.ceil(total / 12)}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</button>
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
  const levelColors = { beginner: ['badge-green', '🟢'], intermediate: ['badge-blue', '🔵'], advanced: ['badge-red', '🔴'] };
  const [cls, dot] = levelColors[course.level] || ['badge-gray', '⚪'];
  return (
    <Link to={`/learn/${course.id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover" style={{ height: '100%' }}>
        <div style={{
          height: '148px', background: 'linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', display: 'flex', gap: '0.375rem' }}>
            {course.is_government_sponsored && <span className="badge" style={{ background: 'rgba(245,158,11,0.9)', color: '#000', fontSize: '0.7rem', fontWeight: 700 }}>🏛️ Gov.</span>}
            {course.is_free && <span className="badge" style={{ background: 'rgba(5,150,105,0.9)', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>FREE</span>}
          </div>
          {CATEGORY_ICONS[course.category] || '📚'}
        </div>
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
            <span className={`badge ${cls}`} style={{ fontSize: '0.7rem' }}>{dot} {course.level}</span>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem', color: 'var(--gray-900)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {course.title}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
            {course.short_description || course.description}
          </p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
            By <strong style={{ color: 'var(--gray-600)' }}>{course.instructor_name}</strong>
          </div>
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: course.is_free ? 'var(--green-600)' : 'var(--gray-900)', fontSize: '1.0625rem' }}>
            {course.is_free ? 'FREE' : `$${course.price}`}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
            {course.rating > 0 && <span>⭐ {course.rating}</span>}
            <span>👥 {course.enrolled_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
