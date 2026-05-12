import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import OpenEdxPlayer from '../../components/learning/OpenEdxPlayer';
import { getCourse, getEnrollment, getCourseProgress, getCourseGrades, normaliseCourse } from '../../services/openedxApi';

export default function CourseLearner() {
  const { courseId } = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const decodedCourseId = decodeURIComponent(courseId);

  const loadCourse = useCallback(async () => {
    try {
      const [rawCourse, enr] = await Promise.all([
        getCourse(decodedCourseId),
        getEnrollment(decodedCourseId).catch(() => null),
      ]);
      const c = normaliseCourse(rawCourse);
      setCourse(c);
      setEnrollment(enr);

      if (enr?.is_active) {
        const [prog, grade] = await Promise.all([
          getCourseProgress(decodedCourseId).catch(() => null),
          getCourseGrades(decodedCourseId).catch(() => null),
        ]);
        setProgress(prog);
        setGrades(grade);
      }
    } catch {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [decodedCourseId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadCourse();
  }, [isAuthenticated, loadCourse, navigate]);

  const handleProgressUpdate = useCallback((pct) => {
    setProgress(prev => ({ ...(prev || {}), _percent: pct }));
  }, []);

  const progressPercent = progress?._percent
    ?? (progress?.completion_summary
      ? Math.round((progress.completion_summary.complete_count / Math.max(1, progress.completion_summary.complete_count + progress.completion_summary.incomplete_count)) * 100)
      : 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-950, #0a0e1a)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--blue-400)', margin: '0 auto 1rem' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading course…</div>
      </div>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1526' }}>
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <div className="empty-title" style={{ color: '#fff' }}>Course not found</div>
        <Link to="/learn" className="btn btn-primary btn-sm">Browse Courses</Link>
      </div>
    </div>
  );

  if (!enrollment?.is_active) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1526' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem', color: '#fff' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Not Enrolled</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          You need to enroll in this course before you can access the content.
        </p>
        <Link to={`/learn/${courseId}`} className="btn btn-primary">
          View Course & Enroll
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0e1a' }}>

      {/* Top navigation bar */}
      <header style={{
        background: '#0d1526', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 1.25rem', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 200, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/learn" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            ← Courses
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {course.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--green-500), var(--green-400))', width: `${progressPercent}%`, borderRadius: '9999px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{progressPercent}%</span>
          </div>

          {/* Grade badge */}
          {grades?.percent !== undefined && (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.25rem 0.625rem', fontSize: '0.8rem', color: grades.passed ? 'var(--green-400)' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
              {grades.passed ? '🏅' : '📊'} {Math.round((grades.percent || 0) * 100)}%
            </div>
          )}

          {/* Info toggle */}
          <button
            onClick={() => setShowInfo(s => !s)}
            style={{ background: showInfo ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: showInfo ? 'var(--blue-300)' : 'rgba(255,255,255,0.5)', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
          >
            ℹ️ Info
          </button>
        </div>
      </header>

      {/* Collapsible info panel */}
      {showInfo && (
        <div style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Course</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{course.title}</div>
          </div>
          {course.instructor_name && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Organization</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>{course.instructor_name}</div>
            </div>
          )}
          {course.pacing && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Pacing</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>{course.pacing === 'self' ? 'Self-Paced' : 'Instructor-Led'}</div>
            </div>
          )}
          {course.start && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Start Date</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>{new Date(course.start).toLocaleDateString()}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Learning Engine</div>
            <div style={{ color: 'var(--blue-300)', fontSize: '0.9rem', fontWeight: 600 }}>Open edX</div>
          </div>
        </div>
      )}

      {/* Open edX course player */}
      <div style={{ flex: 1 }}>
        <OpenEdxPlayer
          courseId={decodedCourseId}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>
    </div>
  );
}
