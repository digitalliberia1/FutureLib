import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    api.get(`/learning/courses/${courseId}`).then(({ data }) => {
      setCourse(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll');
      return;
    }
    setEnrolling(true);
    try {
      await api.post(`/learning/courses/${courseId}/enroll`);
      setEnrolled(true);
      toast.success('Enrolled successfully! 🎉');
    } catch (err) {
      if (err.response?.data?.detail === 'Already enrolled') {
        setEnrolled(true);
        toast('You are already enrolled in this course', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.detail || 'Enrollment failed');
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh' }}><Navbar /><div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div></div>
  );
  if (!course) return (
    <div style={{ minHeight: '100vh' }}><Navbar /><div style={{ textAlign: 'center', padding: '4rem' }}>Course not found</div></div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #1a4fa0 100%)', color: '#fff', padding: '3rem 1rem' }}>
        <div className="container">
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="badge badge-blue">{course.category}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '9999px' }}>{course.level}</span>
              {course.is_free && <span style={{ background: 'var(--color-success)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '9999px' }}>FREE</span>}
              {course.is_government_sponsored && <span style={{ background: 'var(--color-accent)', color: '#000', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '9999px' }}>Gov. Sponsored</span>}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.3 }}>{course.title}</h1>
            <p style={{ opacity: 0.9, fontSize: '1.0625rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>{course.short_description || course.description}</p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9375rem', opacity: 0.85 }}>
              <span>👤 {course.instructor_name}</span>
              <span>📖 {course.total_lessons} lessons</span>
              <span>⏱️ {course.total_duration_hours}h</span>
              <span>👥 {course.enrolled_count} enrolled</span>
              {course.rating > 0 && <span>⭐ {course.rating} ({course.rating_count})</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
          {/* Main Content */}
          <div>
            {/* Learning Outcomes */}
            {course.learning_outcomes?.length > 0 && (
              <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>What You'll Learn</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {course.learning_outcomes.map((o, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.9375rem' }}>
                      <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>About This Course</h2>
              <p style={{ lineHeight: 1.8, color: 'var(--color-text-muted)' }}>{course.description}</p>
            </div>

            {/* Lessons */}
            {course.lessons?.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Course Content — {course.lessons.length} lessons</h2>
                </div>
                <div>
                  {course.lessons.map((lesson, i) => (
                    <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem', borderBottom: i < course.lessons.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <span style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                          {lesson.is_free_preview && <span className="badge badge-green" style={{ marginRight: '0.375rem', fontSize: '0.6875rem' }}>Preview</span>}
                          {lesson.title}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{lessonTypeIcon(lesson.lesson_type)} {lesson.lesson_type} · {lesson.duration_minutes}min</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: course.is_free ? 'var(--color-success)' : 'var(--color-text)', marginBottom: '1rem' }}>
                  {course.is_free ? 'FREE' : `$${course.price}`}
                </div>
                {enrolled ? (
                  <div>
                    <div style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 'var(--radius)', padding: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                      ✓ You're enrolled!
                    </div>
                    <Link to="/dashboard" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Go to Dashboard</Link>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }} onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? <><span className="spinner" /> Enrolling...</> : 'Enroll Now'}
                  </button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                  <span>📖 {course.total_lessons} lessons</span>
                  <span>⏱️ {course.total_duration_hours} hours</span>
                  <span>🌍 {course.language}</span>
                  {course.certificate_available && <span>🏅 Certificate of completion</span>}
                  {course.is_government_sponsored && <span>🏛️ Government sponsored</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function lessonTypeIcon(type) {
  return { video: '🎥', text: '📄', quiz: '❓', assignment: '📝', live: '🔴' }[type] || '📄';
}
