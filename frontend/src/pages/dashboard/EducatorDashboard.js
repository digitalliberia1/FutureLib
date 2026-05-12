import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Programming','AI & Machine Learning','Cybersecurity','Networking','UI/UX Design','Data Science','E-commerce','Digital Marketing','Entrepreneurship','Financial Literacy','Agriculture Technology','Cloud Computing'];
const LEVELS = ['beginner','intermediate','advanced'];

export default function EducatorDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('courses');
  const [createModal, setCreateModal] = useState(false);
  const [lessonModal, setLessonModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', short_description: '', description: '', category: 'Programming', level: 'beginner', language: 'English', is_free: true, price: 0, certificate_available: true, is_government_sponsored: false, learning_outcomes: '', prerequisites: '', tags: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', lesson_type: 'video', duration_minutes: 30, order: 1, is_free_preview: false, content_url: '' });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/learning/courses', { params: { page_size: 50 } });
      const myCourses = (data.courses || []).filter(c => c.instructor_name === user?.full_name);
      setCourses(myCourses);
    } catch { setCourses([]); } finally { setLoading(false); }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/learning/courses', {
        ...courseForm,
        learning_outcomes: courseForm.learning_outcomes.split('\n').filter(Boolean),
        prerequisites: courseForm.prerequisites.split('\n').filter(Boolean),
        tags: courseForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: courseForm.is_free ? 0 : parseFloat(courseForm.price) || 0,
      });
      toast.success('Course created! Set status to Published when ready.');
      setCreateModal(false);
      setCourseForm({ title: '', short_description: '', description: '', category: 'Programming', level: 'beginner', language: 'English', is_free: true, price: 0, certificate_available: true, is_government_sponsored: false, learning_outcomes: '', prerequisites: '', tags: '' });
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Course creation failed');
    } finally { setSubmitting(false); }
  };

  const addLesson = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/learning/courses/${lessonModal.id}/lessons`, lessonForm);
      toast.success('Lesson added!');
      setLessonModal(null);
      setLessonForm({ title: '', description: '', lesson_type: 'video', duration_minutes: 30, order: 1, is_free_preview: false, content_url: '' });
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add lesson');
    } finally { setSubmitting(false); }
  };

  const publishCourse = async (courseId) => {
    try {
      await api.put(`/learning/courses/${courseId}`, { status: 'published' });
      toast.success('Course published!');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to publish');
    }
  };

  const totalEnrollments = courses.reduce((s, c) => s + (c.enrolled_count || 0), 0);
  const published = courses.filter(c => c.status === 'published').length;
  const avgRating = courses.length ? (courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length).toFixed(1) : '—';

  return (
    <DashboardLayout title="Educator Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0]} — manage your courses`}>
      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Courses', value: courses.length, icon: '📚', color: 'var(--blue-700)' },
          { label: 'Published', value: published, icon: '✅', color: 'var(--green-600)' },
          { label: 'Total Enrollments', value: totalEnrollments, icon: '👥', color: 'var(--purple-600)' },
          { label: 'Avg. Rating', value: avgRating, icon: '⭐', color: 'var(--gold-500)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)' }}>
          {['courses', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '0.625rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: tab === t ? 'var(--blue-700)' : 'var(--gray-500)', borderBottom: tab === t ? '2px solid var(--blue-700)' : '2px solid transparent', marginBottom: '-1px', textTransform: 'capitalize' }}>
              {t === 'courses' ? '📚 My Courses' : '📊 Analytics'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ Create Course</button>
      </div>

      {tab === 'courses' && (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '12px' }} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <div className="empty-title">No courses yet</div>
            <div className="empty-desc">Create your first course to start teaching</div>
            <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}>Create Course</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {courses.map(course => (
              <div key={course.id} className="card card-body" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '10px', background: 'linear-gradient(135deg, var(--blue-800), var(--blue-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>📚</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)' }}>{course.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>
                    {course.category} · {course.level} · {course.total_lessons} lessons
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--blue-700)', fontSize: '1.125rem' }}>{course.enrolled_count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 600 }}>Students</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold-500)', fontSize: '1.125rem' }}>{course.rating || '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 600 }}>Rating</div>
                  </div>
                  <span className={`badge ${course.status === 'published' ? 'badge-green' : course.status === 'draft' ? 'badge-yellow' : 'badge-gray'}`}>
                    {course.status}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setLessonModal(course)}>+ Lesson</button>
                    {course.status !== 'published' && (
                      <button className="btn btn-sm btn-primary" onClick={() => publishCourse(course.id)}>Publish</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'analytics' && (
        <div className="card card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {courses.map(c => (
              <div key={c.id} style={{ background: 'var(--gray-50)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-800)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                  <span>👥 {c.enrolled_count} enrolled</span>
                  <span>⭐ {c.rating || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>📚 Create New Course</h2>
              <button onClick={() => setCreateModal(false)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)' }}>×</button>
            </div>
            <form onSubmit={createCourse}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label form-label-req">Course Title</label>
                  <input className="form-input" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Introduction to Python Programming" />
                </div>
                <div>
                  <label className="form-label form-label-req">Short Description</label>
                  <input className="form-input" value={courseForm.short_description} onChange={e => setCourseForm(f => ({ ...f, short_description: e.target.value }))} placeholder="One-line description shown in course listings" />
                </div>
                <div>
                  <label className="form-label form-label-req">Full Description</label>
                  <textarea className="form-input" rows={4} value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} required placeholder="Detailed course description..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Category</label>
                    <select className="form-input" value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Level</label>
                    <select className="form-input" value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}>
                      {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Language</label>
                    <select className="form-input" value={courseForm.language} onChange={e => setCourseForm(f => ({ ...f, language: e.target.value }))}>
                      {['English', 'Kpelle', 'Bassa', 'Grebo', 'Vai'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Pricing</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={courseForm.is_free} onChange={e => setCourseForm(f => ({ ...f, is_free: e.target.checked, price: 0 }))} style={{ accentColor: 'var(--blue-700)' }} />
                        Free Course
                      </label>
                      {!courseForm.is_free && (
                        <input className="form-input" type="number" min="0" step="0.01" value={courseForm.price} onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))} placeholder="Price ($)" style={{ flex: 1 }} />
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                      <input type="checkbox" checked={courseForm.certificate_available} onChange={e => setCourseForm(f => ({ ...f, certificate_available: e.target.checked }))} style={{ accentColor: 'var(--blue-700)' }} />
                      Certificate of completion
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                      <input type="checkbox" checked={courseForm.is_government_sponsored} onChange={e => setCourseForm(f => ({ ...f, is_government_sponsored: e.target.checked }))} style={{ accentColor: 'var(--blue-700)' }} />
                      Government sponsored
                    </label>
                  </div>
                </div>
                <div>
                  <label className="form-label">Learning Outcomes <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(one per line)</span></label>
                  <textarea className="form-input" rows={3} value={courseForm.learning_outcomes} onChange={e => setCourseForm(f => ({ ...f, learning_outcomes: e.target.value }))} placeholder={"Build REST APIs with Python\nDeploy applications to the cloud\nWork with databases"} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Prerequisites <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(one per line)</span></label>
                    <textarea className="form-input" rows={2} value={courseForm.prerequisites} onChange={e => setCourseForm(f => ({ ...f, prerequisites: e.target.value }))} placeholder="Basic computer skills" />
                  </div>
                  <div>
                    <label className="form-label">Tags <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(comma separated)</span></label>
                    <input className="form-input" value={courseForm.tags} onChange={e => setCourseForm(f => ({ ...f, tags: e.target.value }))} placeholder="python, backend, api" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setCreateModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2, justifyContent: 'center' }}>
                  {submitting ? 'Creating...' : 'Create Course (Draft)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {lessonModal && (
        <div className="modal-overlay" onClick={() => setLessonModal(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Add Lesson</div>
                <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>{lessonModal.title}</h2>
              </div>
              <button onClick={() => setLessonModal(null)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)' }}>×</button>
            </div>
            <form onSubmit={addLesson}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label form-label-req">Lesson Title</label>
                  <input className="form-input" value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Introduction to Variables" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-input" value={lessonForm.lesson_type} onChange={e => setLessonForm(f => ({ ...f, lesson_type: e.target.value }))}>
                      {['video','text','quiz','assignment','live'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Duration (min)</label>
                    <input className="form-input" type="number" min="1" value={lessonForm.duration_minutes} onChange={e => setLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="form-label">Order</label>
                    <input className="form-input" type="number" min="1" value={lessonForm.order} onChange={e => setLessonForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Content URL <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(video, slides, etc.)</span></label>
                  <input className="form-input" value={lessonForm.content_url} onChange={e => setLessonForm(f => ({ ...f, content_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief lesson description..." />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  <input type="checkbox" checked={lessonForm.is_free_preview} onChange={e => setLessonForm(f => ({ ...f, is_free_preview: e.target.checked }))} style={{ accentColor: 'var(--blue-700)' }} />
                  Free preview (visible to non-enrolled users)
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setLessonModal(null)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2, justifyContent: 'center' }}>
                  {submitting ? 'Adding...' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
