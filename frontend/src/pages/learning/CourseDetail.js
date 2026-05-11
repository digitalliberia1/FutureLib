import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = { 'Programming': '💻', 'AI & Machine Learning': '🤖', 'Cybersecurity': '🛡️', 'Networking': '🌐', 'UI/UX Design': '🎨', 'Data Science': '📊', 'E-commerce': '🛒', 'Digital Marketing': '📣', 'Entrepreneurship': '🚀', 'Financial Literacy': '💰', 'Agriculture Technology': '🌾', 'Cloud Computing': '☁️' };

export default function CourseDetail() {
  const { courseId } = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [openLesson, setOpenLesson] = useState(null);

  useEffect(() => {
    api.get(`/learning/courses/${courseId}`).then(({ data }) => {
      setCourse(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isAuthenticated) { toast.error('Please log in to enroll'); return; }
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', borderWidth: '3px', margin: '0 auto 1rem' }} />
          <div style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Loading course...</div>
        </div>
      </div>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="empty-state" style={{ flex: 1 }}>
        <div className="empty-icon">📚</div>
        <div className="empty-title">Course not found</div>
        <Link to="/learn" className="btn btn-primary btn-sm">Browse Courses</Link>
      </div>
    </div>
  );

  const icon = CATEGORY_ICONS[course.category] || '📚';
  const levelColors = { beginner: 'badge-green', intermediate: 'badge-blue', advanced: 'badge-red' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 60%, var(--blue-700) 100%)', color: '#fff', padding: '3.5rem 1.25rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(200,16,46,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.125rem' }}>
            <Link to="/learn" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', textDecoration: 'none' }}>Courses</Link>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{course.category}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
            <div style={{ maxWidth: '700px' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className={`badge ${levelColors[course.level] || 'badge-gray'}`}>{course.level}</span>
                {course.is_free && <span className="badge" style={{ background: 'rgba(5,150,105,0.9)', color: '#fff', fontWeight: 700 }}>FREE</span>}
                {course.is_government_sponsored && <span className="badge" style={{ background: 'rgba(245,158,11,0.9)', color: '#000', fontWeight: 700 }}>🏛️ Gov. Sponsored</span>}
                {course.certificate_available && <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}>🏅 Certificate</span>}
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.875rem', lineHeight: 1.25 }}>{course.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.0625rem', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: '620px' }}>{course.short_description || course.description?.slice(0, 180)}</p>
              <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap', fontSize: '0.9375rem' }}>
                {[
                  ['👤', `By ${course.instructor_name}`],
                  ['📖', `${course.total_lessons || 0} lessons`],
                  ['⏱️', `${course.total_duration_hours || 0}h total`],
                  ['👥', `${course.enrolled_count || 0} enrolled`],
                  ...(course.rating > 0 ? [['⭐', `${course.rating} (${course.rating_count} reviews)`]] : []),
                ].map(([icon, text]) => (
                  <span key={text} style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {icon} {text}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '6rem', opacity: 0.25, display: 'none' }}>{icon}</div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2.5rem 1.25rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* What you'll learn */}
            {course.learning_outcomes?.length > 0 && (
              <div className="card card-body">
                <h2 style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '1.25rem', color: 'var(--gray-900)' }}>What You'll Learn</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                  {course.learning_outcomes.map((o, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--green-600)', fontWeight: 700, flexShrink: 0, marginTop: '0.125rem' }}>✓</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)', lineHeight: 1.55 }}>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="card card-body">
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--gray-900)' }}>About This Course</h2>
              <p style={{ lineHeight: 1.8, color: 'var(--gray-600)', fontSize: '0.9375rem' }}>{course.description}</p>
            </div>

            {/* Course content */}
            {course.lessons?.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span style={{ fontWeight: 700 }}>📋 Course Content</span>
                  <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{course.lessons.length} lessons</span>
                </div>
                <div>
                  {course.lessons.map((lesson, i) => (
                    <div
                      key={lesson.id}
                      onClick={() => setOpenLesson(openLesson === lesson.id ? null : lesson.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem 1.5rem',
                        borderBottom: i < course.lessons.length - 1 ? '1px solid var(--gray-100)' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                        background: openLesson === lesson.id ? 'var(--blue-50)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (openLesson !== lesson.id) e.currentTarget.style.background = 'var(--gray-50)'; }}
                      onMouseLeave={(e) => { if (openLesson !== lesson.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '2.25rem', height: '2.25rem', borderRadius: '50%', flexShrink: 0,
                        background: openLesson === lesson.id ? 'var(--blue-700)' : 'var(--gray-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8125rem', fontWeight: 800,
                        color: openLesson === lesson.id ? '#fff' : 'var(--gray-500)',
                        transition: 'all 0.15s',
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {lesson.is_free_preview && <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>Preview</span>}
                          {lesson.title}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                          {lessonTypeIcon(lesson.lesson_type)} {lesson.lesson_type} · {lesson.duration_minutes} min
                        </div>
                      </div>
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>{openLesson === lesson.id ? '▲' : '▼'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites?.length > 0 && (
              <div className="card card-body" style={{ background: 'var(--gold-100)', border: '1px solid #fde68a' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.875rem', color: 'var(--gold-700)' }}>Prerequisites</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {course.prerequisites.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gold-700)' }}>
                      <span>•</span> {p}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Enroll card */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--blue-800), var(--blue-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>
                {icon}
              </div>
              <div className="card-body">
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: course.is_free ? 'var(--green-600)' : 'var(--gray-900)', marginBottom: '1.125rem', textAlign: 'center' }}>
                  {course.is_free ? 'FREE' : `$${course.price}`}
                </div>
                {enrolled ? (
                  <>
                    <div style={{ background: 'var(--green-50)', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem', fontWeight: 700, color: 'var(--green-700)', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                      ✓ You're enrolled!
                    </div>
                    <Link to="/dashboard" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Go to Dashboard</Link>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Enrolling...</> : course.is_free ? 'Enroll for Free' : 'Enroll Now'}
                  </button>
                )}
              </div>
              <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--gray-100)', paddingTop: '1.125rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    ['📖', `${course.total_lessons || 0} lessons`],
                    ['⏱️', `${course.total_duration_hours || 0} hours`],
                    ['🌍', course.language || 'English'],
                    ...(course.certificate_available ? [['🏅', 'Certificate of completion']] : []),
                    ...(course.is_government_sponsored ? [['🏛️', 'Government sponsored']] : []),
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      <span style={{ width: '1.25rem', textAlign: 'center' }}>{icon}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructor card */}
            <div className="card card-body">
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>Instructor</div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-700), var(--blue-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.125rem', flexShrink: 0 }}>
                  {course.instructor_name?.[0] || 'I'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{course.instructor_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>{course.category} Expert</div>
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
