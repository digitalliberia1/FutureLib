import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote', 'Government'];
const EXP_LEVELS = ['All', 'Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

const TYPE_BADGE = {
  'Full-time': 'badge-blue', 'Part-time': 'badge-gray', 'Contract': 'badge-yellow',
  'Internship': 'badge-purple', 'Freelance': 'badge-green', 'Remote': 'badge-green',
  'Government': 'badge-blue',
};

export default function JobMarketplace() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jobType, setJobType] = useState('');
  const [expLevel, setExpLevel] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [isGov, setIsGov] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyModal, setApplyModal] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => { fetchJobs(); }, [page, jobType, expLevel, isRemote, isGov]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10 };
      if (jobType && jobType !== 'All') params.job_type = jobType;
      if (expLevel && expLevel !== 'All') params.experience_level = expLevel;
      if (isRemote) params.is_remote = true;
      if (isGov) params.is_government = true;
      const { data } = await api.get('/jobs/', { params });
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) { toast.error('Please log in to apply'); return; }
    setApplying(true);
    try {
      await api.post(`/jobs/${applyModal.id}/apply`, { cover_letter: coverLetter || undefined });
      toast.success('Application submitted! 🎉');
      setApplyModal(null);
      setCoverLetter('');
      fetchJobs();
    } catch (err) {
      if (err.response?.data?.detail === 'Already applied for this job') {
        toast('You already applied for this job', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.detail || 'Application failed');
      }
    } finally {
      setApplying(false);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, var(--green-700) 60%, var(--green-600) 100%)', color: '#fff', padding: '3.5rem 1.25rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 40%, rgba(5,150,105,0.3) 0%, transparent 55%), radial-gradient(circle at 15% 60%, rgba(26,58,107,0.2) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>National Employment Platform</div>
          <h1 className="heading-display" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.875rem' }}>Job Marketplace</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', maxWidth: '540px', marginBottom: '1.75rem' }}>
            AI-powered matching connecting skilled Liberians with local and remote opportunities across all sectors.
          </p>
          <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2rem' }}>
            {[[total || '—', 'Open Positions'], ['50+', 'Companies'], ['Remote', 'Opportunities']].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: 'var(--gold-400)', fontWeight: 900, fontSize: '1.5rem' }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '14px 14px 0 0', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid rgba(255,255,255,0.15)', borderBottom: 'none' }}>
            <select
              value={jobType}
              onChange={(e) => { setJobType(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', padding: '0.5rem 0.875rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {JOB_TYPES.map((t) => <option key={t} value={t === 'All' ? '' : t} style={{ color: '#000', background: '#fff' }}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
            <select
              value={expLevel}
              onChange={(e) => { setExpLevel(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', padding: '0.5rem 0.875rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {EXP_LEVELS.map((l) => <option key={l} value={l === 'All' ? '' : l} style={{ color: '#000', background: '#fff' }}>{l === 'All' ? 'All Levels' : l}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              <input type="checkbox" checked={isRemote} onChange={(e) => { setIsRemote(e.target.checked); setPage(1); }} style={{ accentColor: 'var(--gold-400)', width: '1rem', height: '1rem' }} />
              Remote only
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              <input type="checkbox" checked={isGov} onChange={(e) => { setIsGov(e.target.checked); setPage(1); }} style={{ accentColor: 'var(--gold-400)', width: '1rem', height: '1rem' }} />
              Government
            </label>
            {(jobType || expLevel || isRemote || isGov) && (
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', marginLeft: 'auto' }}
                onClick={() => { setJobType(''); setExpLevel(''); setIsRemote(false); setIsGov(false); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '1.75rem 1.25rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 400px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Job list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>
                {loading ? 'Searching...' : `${total} job${total !== 1 ? 's' : ''} found`}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card card-body">
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: '12px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: '14px', width: '30%', marginBottom: '0.375rem' }} />
                        <div className="skeleton" style={{ height: '18px', width: '60%', marginBottom: '0.5rem' }} />
                        <div className="skeleton" style={{ height: '13px', width: '45%' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💼</div>
                <div className="empty-title">No jobs found</div>
                <div className="empty-desc">Try adjusting your filters to find more opportunities</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setJobType(''); setExpLevel(''); setIsRemote(false); setIsGov(false); }}>Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        borderLeft: `4px solid ${isSelected ? 'var(--green-600)' : 'transparent'}`,
                        transition: 'all 0.15s',
                        background: isSelected ? 'var(--green-50)' : '#fff',
                      }}
                      onClick={() => setSelectedJob(isSelected ? null : job)}
                      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderLeftColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; } }}
                      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = '#fff'; } }}
                    >
                      <div className="card-body" style={{ padding: '1.125rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                              {job.is_government_post && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>🏛️ Gov</span>}
                              <span className={`badge ${TYPE_BADGE[job.job_type] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{job.job_type}</span>
                              {job.is_remote && <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>🌍 Remote</span>}
                              <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{job.experience_level}</span>
                            </div>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--gray-900)', lineHeight: 1.35 }}>{job.title}</h3>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                              <strong style={{ color: 'var(--gray-700)' }}>{job.employer_name}</strong>
                              {job.county && ` · ${job.county}, Liberia`}
                            </div>
                            {(job.salary_min || job.salary_max) && (
                              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--green-600)', marginTop: '0.375rem' }}>
                                💵 {job.salary_negotiable ? 'Salary Negotiable' : `LRD ${job.salary_min?.toLocaleString()} – ${job.salary_max?.toLocaleString()}`}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flexShrink: 0 }}
                            onClick={(e) => { e.stopPropagation(); setApplyModal(job); }}
                          >
                            Apply
                          </button>
                        </div>
                        {job.skills_required?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {job.skills_required.slice(0, 5).map((skill) => (
                              <span key={skill} style={{ background: 'var(--gray-100)', borderRadius: '5px', padding: '0.125rem 0.5rem', fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 500 }}>
                                {skill}
                              </span>
                            ))}
                            {job.skills_required.length > 5 && <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>+{job.skills_required.length - 5} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>

          {/* Job detail panel */}
          {selectedJob && (
            <div style={{ position: 'sticky', top: '80px' }}>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #064e3b, var(--green-700))', padding: '1.25rem 1.5rem', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                        {selectedJob.is_government_post && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>🏛️ Gov</span>}
                        {selectedJob.is_remote && <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>🌍 Remote</span>}
                      </div>
                      <h2 style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>{selectedJob.title}</h2>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>{selectedJob.employer_name}</div>
                    </div>
                    <button onClick={() => setSelectedJob(null)} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.125rem', flexShrink: 0 }}>×</button>
                  </div>
                </div>
                <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                  {(selectedJob.salary_min || selectedJob.salary_max) && (
                    <div style={{ background: 'var(--green-50)', borderRadius: '8px', padding: '0.625rem 0.875rem', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontWeight: 700, color: 'var(--green-700)' }}>
                        💵 {selectedJob.salary_negotiable ? 'Salary Negotiable' : `LRD ${selectedJob.salary_min?.toLocaleString()} – ${selectedJob.salary_max?.toLocaleString()}`}
                      </div>
                    </div>
                  )}
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.75, marginBottom: '1.25rem', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
                  {selectedJob.requirements?.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.625rem', color: 'var(--gray-800)', fontSize: '0.9375rem' }}>Requirements</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {selectedJob.requirements.map((r, i) => (
                          <div key={i} style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'flex', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--green-600)', fontWeight: 700, flexShrink: 0 }}>•</span> {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedJob.skills_required?.length > 0 && (
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.625rem', color: 'var(--gray-800)', fontSize: '0.9375rem' }}>Required Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {selectedJob.skills_required.map((s) => (
                          <span key={s} className="badge badge-blue">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setApplyModal(selectedJob)}>
                    Apply for This Job →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div className="modal-overlay" onClick={() => setApplyModal(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease both' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Job Application</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--gray-900)' }}>{applyModal.title}</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>{applyModal.employer_name}</div>
              </div>
              <button onClick={() => setApplyModal(null)} style={{ border: 'none', background: 'var(--gray-100)', borderRadius: '8px', cursor: 'pointer', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', color: 'var(--gray-500)', flexShrink: 0 }}>×</button>
            </div>
            <div className="modal-body">
              <div>
                <label className="form-label">Cover Letter <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="Tell the employer why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div style={{ background: 'var(--blue-50)', borderRadius: '10px', padding: '0.875rem', border: '1px solid #bfdbfe', fontSize: '0.8125rem', color: 'var(--blue-700)', marginTop: '1rem' }}>
                ℹ️ Your profile, skills, and any uploaded CV from your account will be shared with the employer.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setApplyModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply} disabled={applying} style={{ flex: 2, justifyContent: 'center' }}>
                {applying ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> Submitting...</> : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
