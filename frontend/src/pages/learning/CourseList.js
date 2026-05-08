import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

const CATEGORIES = [
  'All', 'Programming', 'AI & Machine Learning', 'Cybersecurity', 'Networking',
  'UI/UX Design', 'Data Science', 'E-commerce', 'Digital Marketing',
  'Entrepreneurship', 'Financial Literacy', 'Agriculture Technology',
];

const LEVELS = ['All Levels', 'beginner', 'intermediate', 'advanced'];

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [isFree, setIsFree] = useState(null);
  const [isGov, setIsGov] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [page, category, level, isFree, isGov]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 12 };
      if (category && category !== 'All') params.category = category;
      if (level && level !== 'All Levels') params.level = level;
      if (isFree !== null) params.is_free = isFree;
      if (isGov) params.is_government_sponsored = true;
      const { data } = await api.get('/learning/courses', { params });
      setCourses(data.courses || []);
      setTotal(data.total || 0);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '3rem 1rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>Digital Learning Platform</h1>
        <p style={{ opacity: 0.85, fontSize: '1.125rem', maxWidth: '550px', margin: '0 auto' }}>
          Government-certified courses taught by expert instructors. Earn national certificates.
        </p>
      </div>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem' }} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            {CATEGORIES.map((c) => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem' }} value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
            {LEVELS.map((l) => <option key={l} value={l === 'All Levels' ? '' : l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isFree === true} onChange={(e) => { setIsFree(e.target.checked ? true : null); setPage(1); }} />
            Free Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isGov} onChange={(e) => { setIsGov(e.target.checked); setPage(1); }} />
            Gov. Sponsored
          </label>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>
            {total} course{total !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No courses found</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {courses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function CourseCard({ course }) {
  const levelColor = { beginner: 'badge-green', intermediate: 'badge-blue', advanced: 'badge-red' };
  return (
    <Link to={`/learn/${course.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #1a4fa0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
          {getCategoryIcon(course.category)}
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
            <span className={`badge ${levelColor[course.level] || 'badge-gray'}`}>{course.level}</span>
            {course.is_government_sponsored && <span className="badge badge-purple">Gov. Sponsored</span>}
            {course.is_free && <span className="badge badge-green">Free</span>}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.375rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{course.title}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {course.short_description || course.description}
          </p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            By {course.instructor_name}
          </div>
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: course.is_free ? 'var(--color-success)' : 'var(--color-text)' }}>
              {course.is_free ? 'FREE' : `$${course.price}`}
            </span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem' }}>
            <span>⭐ {course.rating || 'New'}</span>
            <span>👥 {course.enrolled_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ height: '160px', background: 'var(--color-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div className="card-body">
        <div style={{ height: '12px', width: '60%', background: 'var(--color-border)', borderRadius: '6px', marginBottom: '0.75rem' }} />
        <div style={{ height: '18px', background: 'var(--color-border)', borderRadius: '6px', marginBottom: '0.5rem' }} />
        <div style={{ height: '14px', width: '75%', background: 'var(--color-border)', borderRadius: '6px' }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

function getCategoryIcon(cat) {
  const icons = {
    'Programming': '💻', 'AI & Machine Learning': '🤖', 'Cybersecurity': '🛡️',
    'Networking': '🌐', 'UI/UX Design': '🎨', 'Data Science': '📊',
    'E-commerce': '🛒', 'Digital Marketing': '📣', 'Entrepreneurship': '🚀',
    'Financial Literacy': '💰', 'Agriculture Technology': '🌾', 'Cloud Computing': '☁️',
  };
  return icons[cat] || '📚';
}
