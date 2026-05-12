import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import toast from 'react-hot-toast';
import { getCourse, enrollInCourse, getEnrollment, normaliseCourse } from '../../services/openedxApi';

const CATEGORY_ICONS = {
  Programming: '💻', 'AI & Machine Learning': '🤖', Cybersecurity: '🛡️',
  Networking: '🌐', 'UI/UX Design': '🎨', 'Data Science': '📊',
  'E-commerce': '🛒', 'Digital Marketing': '📣', Entrepreneurship: '🚀',
  'Financial Literacy': '💰', 'Agriculture Technology': '🌾', 'Cloud Computing': '☁️',
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  // Decode the course ID (URL-encoded course key)
  const decodedCourseId = decodeURIComponent(courseId);

  useEffect(() => {
    const load = async () => {
      try {
        const [raw, enr] = await Promise.all([
          getCourse(decodedCourseId),
          isAuthenticated ? getEnrollment(decodedCourseId).catch(() => null) : Promise.resolve(null),
        ]);
        setCourse(normaliseCourse(raw));
        setEnrollment(enr);
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [decodedCourseId, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll');
      navigate('/login');
      return;
    }
    setEnrolling(true);
    try {
      const result = await enrollInCourse(decodedCourseId, 'honor');
      setEnrollment(result.enrollment || { is_active: true });
      toast.success('Enrolled successfully! 🎉');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string' && detail.toLowerCase().includes('already')) {
        setEnrollment({ is_active: true });
        toast('You are already enrolled in this course', { icon: 'ℹ️' });
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Enrollment failed');
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
          <div style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Loading course…</div>
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
  const lvl = course.level?.toLowerCase() || 'beginner';
  const isEnrolled = enrollment?.is_active || false;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: course.thumbnail_url
          ? `linear-gradient(135deg, rgba(10,20,60,0.92) 0%, rgba(10,20,60,0.75) 100%), url(${course.thumbnail_url}) center/cover no-repeat`
          : 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 60%, var(--blue-700) 100%)',
        color: '#fff', padding: '3.5rem 1.25rem 2.5rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(200,16,46,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.125rem' }}>
            <Link to="/learn" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', textDecoration: 'none' }}>Courses</Link>
            {course.category && <>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>›</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{course.category}</span>
            </>}
          </div>

          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className={`badge ${levelColors[lvl] || 'badge-gray'}`}>{lvl}</span>
              {course.is_free && <span className="badge" style={{ background: 'rgba(5,150,105,0.9)', color: '#fff', fontWeight: 700 }}>FREE</span>}
              {course.certificate_available && <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}>🏅 Certificate</span>}
              {course.pacing === 'self' && <span className="badge" style={{ background: 'rgba(99,102,241,0.85)', color: '#fff', fontWeight: 700 }}>Self-Paced</span>}
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>Powered by Open edX</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.875rem', lineHeight: 1.25 }}>{course.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.0625rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              {course.short_description || course.description?.slice(0, 200)}
            </p>
            <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap', fontSize: '0.9375rem' }}>
              {course.instructor_name && <span style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>👤 By {course.instructor_name}</span>}
              {course.enrolled_count > 0 && <span style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>👥 {course.enrolled_count?.toLocaleString()} enrolled</span>}
              {course.start && <span style={{ color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>📅 Starts {new Date(course.start).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2.5rem 1.25rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* About */}
            <div className="card card-body">
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--gray-900)' }}>About This Course</h2>
              <div
                style={{ lineHeight: 1.8, color: 'var(--gray-600)', fontSize: '0.9375rem' }}
                dangerouslySetInnerHTML={{ __html: course.description || course.short_description || 'No description available.' }}
              />
            </div>

            {/* What you'll learn (tags as outcomes) */}
            {course.tags?.length > 0 && (
              <div className="card card-body">
                <h2 style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '1.25rem', color: 'var(--gray-900)' }}>Topics Covered</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {course.tags.map((tag, i) => (
                    <span key={i} className="badge badge-blue" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Course schedule info */}
            {(course.start || course.end) && (
              <div className="card card-body" style={{ background: 'var(--blue-50)', border: '1px solid var(--blue-100)' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.875rem', color: 'var(--blue-800)' }}>Course Schedule</h2>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {course.start && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--blue-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</div>
                      <div style={{ color: 'var(--blue-900)', fontWeight: 700 }}>{new Date(course.start).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  )}
                  {course.end && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--blue-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</div>
                      <div style={{ color: 'var(--blue-900)', fontWeight: 700 }}>{new Date(course.end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--blue-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pacing</div>
                    <div style={{ color: 'var(--blue-900)', fontWeight: 700 }}>{course.pacing === 'self' ? 'Self-Paced' : 'Instructor-Led'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Enroll card */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{
                height: '120px',
                background: course.thumbnail_url
                  ? `url(${course.thumbnail_url}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--blue-800), var(--blue-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem',
              }}>
                {!course.thumbnail_url && icon}
              </div>
              <div className="card-body">
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: course.is_free ? 'var(--green-600)' : 'var(--gray-900)', marginBottom: '1.125rem', textAlign: 'center' }}>
                  {course.is_free ? 'FREE' : course.price ? `$${course.price}` : 'FREE'}
                </div>
                {isEnrolled ? (
                  <>
                    <div style={{ background: 'var(--green-50)', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem', fontWeight: 700, color: 'var(--green-700)', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                      ✓ You're enrolled!
                    </div>
                    <Link
                      to={`/learn/${courseId}/play`}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', display: 'flex', textDecoration: 'none' }}
                    >
                      Continue Learning →
                    </Link>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling
                      ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Enrolling…</>
                      : course.is_free ? 'Enroll for Free' : 'Enroll Now'
                    }
                  </button>
                )}
              </div>
              <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--gray-100)', paddingTop: '1.125rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    ...(course.pacing ? [['🔄', course.pacing === 'self' ? 'Self-Paced' : 'Instructor-Led']] : []),
                    ['🌍', 'English'],
                    ...(course.certificate_available ? [['🏅', 'Certificate of completion']] : []),
                    ['⚙️', 'Open edX Platform'],
                  ].map(([ico, text]) => (
                    <div key={text} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      <span style={{ width: '1.25rem', textAlign: 'center' }}>{ico}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructor / Org card */}
            {course.instructor_name && (
              <div className="card card-body">
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>Organization</div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--blue-700), var(--blue-500))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '1.125rem', flexShrink: 0,
                  }}>
                    {course.instructor_name?.[0]?.toUpperCase() || 'O'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{course.instructor_name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>Course Provider</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
