import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LESSON_TYPE_ICONS = { video: '🎥', text: '📄', quiz: '❓', assignment: '📝', live: '🔴' };

export default function CourseLearner() {
  const { courseId } = useParams();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadCourse();
  }, [courseId, isAuthenticated]);

  const loadCourse = async () => {
    try {
      const [{ data: courseData }, { data: myCoursesData }] = await Promise.all([
        api.get(`/learning/courses/${courseId}`),
        api.get('/learning/my-courses'),
      ]);
      setCourse(courseData);
      const sortedLessons = (courseData.lessons || []).sort((a, b) => a.order - b.order);
      setLessons(sortedLessons);
      const enroll = myCoursesData.enrollments?.find(e => e.course_id === courseId);
      setEnrollment(enroll || null);
      if (sortedLessons.length > 0) {
        const lastCompleted = enroll?.lessons_completed || [];
        const nextLesson = sortedLessons.find(l => !lastCompleted.includes(l.id)) || sortedLessons[0];
        setCurrentLesson(nextLesson);
      }
    } catch { toast.error('Failed to load course'); }
    finally { setLoading(false); }
  };

  const completeLesson = async () => {
    if (!currentLesson || !enrollment) return;
    setCompleting(true);
    try {
      const { data } = await api.post(`/learning/courses/${courseId}/lessons/${currentLesson.id}/complete`);
      toast.success(data.completed ? '🎉 Course completed! Certificate issued!' : '✓ Lesson completed!');
      await loadCourse();
      setQuizAnswers({});
      setQuizSubmitted(false);
      if (!data.completed) {
        const completedIds = [...(enrollment?.lessons_completed || []), currentLesson.id];
        const nextLesson = lessons.find(l => !completedIds.includes(l.id) && l.id !== currentLesson.id);
        if (nextLesson) setCurrentLesson(nextLesson);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete lesson');
    } finally { setCompleting(false); }
  };

  const isCompleted = (lessonId) => enrollment?.lessons_completed?.includes(lessonId);
  const progress = enrollment?.progress_percent || 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px', margin: '0 auto 1rem' }} />
        <div style={{ color: 'var(--gray-500)' }}>Loading course...</div>
      </div>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-state"><div className="empty-icon">📚</div><div className="empty-title">Course not found</div><Link to="/learn" className="btn btn-primary btn-sm">Browse Courses</Link></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-950, #0a0e1a)' }}>
      {/* Top bar */}
      <header style={{ background: '#0d1526', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1.25rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', padding: '0.375rem 0.625rem', fontSize: '1rem' }}>☰</button>
          <Link to="/learn" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.8125rem' }}>← Courses</Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--green-500), var(--green-400))', width: `${progress}%`, borderRadius: '9999px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', fontWeight: 600 }}>{progress}%</span>
          </div>
          {enrollment?.certificate_issued && (
            <Link to="/profile" style={{ background: 'var(--gold-400)', color: '#000', borderRadius: '20px', padding: '0.375rem 0.875rem', fontWeight: 800, fontSize: '0.8125rem', textDecoration: 'none' }}>🏅 Certificate</Link>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Lesson sidebar */}
        <aside style={{ width: sidebarOpen ? '300px' : '0', flexShrink: 0, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', transition: 'width 0.25s ease', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Course Content</div>
            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>{enrollment?.lessons_completed?.length || 0} / {lessons.length} lessons</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {lessons.map((lesson, i) => {
              const done = isCompleted(lesson.id);
              const active = currentLesson?.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => { setCurrentLesson(lesson); setQuizAnswers({}); setQuizSubmitted(false); contentRef.current?.scrollTo(0, 0); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    background: active ? 'rgba(59,130,246,0.2)' : done ? 'rgba(5,150,105,0.05)' : 'transparent',
                    borderLeft: `3px solid ${active ? 'var(--blue-500)' : done ? 'var(--green-500)' : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(59,130,246,0.2)' : done ? 'rgba(5,150,105,0.05)' : 'transparent'; }}
                >
                  <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800, background: done ? 'var(--green-600)' : active ? 'var(--blue-600)' : 'rgba(255,255,255,0.1)', color: done || active ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: active ? 700 : 500, color: active ? '#fff' : done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.55)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                      {lesson.is_free_preview && <span style={{ fontSize: '0.65rem', background: 'var(--green-600)', color: '#fff', borderRadius: '4px', padding: '0.1rem 0.3rem', marginRight: '0.375rem', fontWeight: 700 }}>FREE</span>}
                      {lesson.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>
                      {LESSON_TYPE_ICONS[lesson.lesson_type]} {lesson.lesson_type} · {lesson.duration_minutes}m
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {currentLesson ? (
            <>
              {/* Video / Content area */}
              {currentLesson.lesson_type === 'video' && (
                <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
                  {currentLesson.content_url ? (
                    <iframe src={currentLesson.content_url} style={{ width: '100%', height: '400px', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen title={currentLesson.title} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎥</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>Video content coming soon</div>
                      <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>The instructor is preparing this lesson</div>
                    </div>
                  )}
                </div>
              )}

              {currentLesson.lesson_type === 'live' && (
                <div style={{ background: 'linear-gradient(135deg, #1e0a0a, #3b0000)', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>🔴</span>
                  <div style={{ color: '#fff' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>Live Session</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Check schedule for next live class</div>
                  </div>
                </div>
              )}

              {/* Lesson body */}
              <div style={{ padding: '2rem', flex: 1, background: '#fff', maxWidth: '860px', width: '100%', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem' }}>{LESSON_TYPE_ICONS[currentLesson.lesson_type]}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'capitalize' }}>{currentLesson.lesson_type}</span>
                      <span style={{ color: 'var(--gray-300)' }}>·</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>{currentLesson.duration_minutes} min</span>
                      {isCompleted(currentLesson.id) && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Completed</span>}
                    </div>
                    <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1.3 }}>{currentLesson.title}</h1>
                  </div>
                  <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
                    {lessons.indexOf(currentLesson) > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { const idx = lessons.indexOf(currentLesson); setCurrentLesson(lessons[idx - 1]); setQuizAnswers({}); setQuizSubmitted(false); }}>← Prev</button>
                    )}
                    {lessons.indexOf(currentLesson) < lessons.length - 1 && (
                      <button className="btn btn-outline btn-sm" onClick={() => { const idx = lessons.indexOf(currentLesson); setCurrentLesson(lessons[idx + 1]); setQuizAnswers({}); setQuizSubmitted(false); }}>Next →</button>
                    )}
                  </div>
                </div>

                {currentLesson.description && (
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.75, marginBottom: '1.5rem', fontSize: '0.9375rem' }}>{currentLesson.description}</p>
                )}

                {/* Text content */}
                {currentLesson.lesson_type === 'text' && currentLesson.content_text && (
                  <div style={{ color: 'var(--gray-700)', lineHeight: 1.8, fontSize: '0.9375rem', whiteSpace: 'pre-wrap' }}>
                    {currentLesson.content_text}
                  </div>
                )}

                {/* Quiz */}
                {currentLesson.lesson_type === 'quiz' && currentLesson.quiz_questions?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {currentLesson.quiz_questions.map((q, qi) => (
                      <div key={qi} style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--gray-200)' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-800)', marginBottom: '0.875rem' }}>Q{qi + 1}. {q.question}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {q.options?.map((opt, oi) => {
                            const selected = quizAnswers[qi] === oi;
                            const correct = quizSubmitted && oi === q.correct_index;
                            const wrong = quizSubmitted && selected && oi !== q.correct_index;
                            return (
                              <button
                                key={oi}
                                onClick={() => !quizSubmitted && setQuizAnswers(a => ({ ...a, [qi]: oi }))}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: `2px solid ${correct ? 'var(--green-500)' : wrong ? 'var(--red-500)' : selected ? 'var(--blue-500)' : 'var(--gray-200)'}`, borderRadius: '8px', cursor: quizSubmitted ? 'default' : 'pointer', textAlign: 'left', background: correct ? 'var(--green-50)' : wrong ? 'var(--red-50)' : selected ? 'var(--blue-50)' : '#fff', transition: 'all 0.15s',
                                }}
                              >
                                <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', border: `2px solid ${correct ? 'var(--green-500)' : wrong ? 'var(--red-500)' : selected ? 'var(--blue-500)' : 'var(--gray-300)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected || correct ? (correct ? 'var(--green-500)' : wrong ? 'var(--red-500)' : 'var(--blue-500)') : 'transparent' }}>
                                  {(selected || correct || wrong) && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>{correct ? '✓' : wrong ? '✗' : '●'}</span>}
                                </div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)', fontWeight: selected ? 600 : 400 }}>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && q.explanation && (
                          <div style={{ marginTop: '0.875rem', padding: '0.75rem', background: 'var(--blue-50)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--blue-700)', border: '1px solid #bfdbfe' }}>
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                    {!quizSubmitted && Object.keys(quizAnswers).length === currentLesson.quiz_questions.length && (
                      <button className="btn btn-primary" onClick={() => setQuizSubmitted(true)}>Submit Quiz</button>
                    )}
                  </div>
                )}

                {/* Complete button */}
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-100)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
                    Lesson {lessons.indexOf(currentLesson) + 1} of {lessons.length}
                  </div>
                  {!isCompleted(currentLesson.id) ? (
                    <button className="btn btn-primary" onClick={completeLesson} disabled={completing || (currentLesson.lesson_type === 'quiz' && !quizSubmitted && currentLesson.quiz_questions?.length > 0)}>
                      {completing ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Saving...</> : '✓ Mark Complete'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green-600)', fontWeight: 700 }}>
                      <span>✓</span> Completed
                      {lessons.indexOf(currentLesson) < lessons.length - 1 && (
                        <button className="btn btn-primary btn-sm" style={{ marginLeft: '0.75rem' }} onClick={() => { const idx = lessons.indexOf(currentLesson); setCurrentLesson(lessons[idx + 1]); setQuizAnswers({}); setQuizSubmitted(false); }}>
                          Next Lesson →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, background: '#1a1f2e' }}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{course.title}</div>
                <div style={{ marginBottom: '1.5rem' }}>Select a lesson from the sidebar to begin</div>
                {!enrollment && <Link to={`/learn/${courseId}`} className="btn btn-primary">Enroll First</Link>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
