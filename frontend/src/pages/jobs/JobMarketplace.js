import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';
import toast from 'react-hot-toast';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote', 'Government'];
const EXP_LEVELS = ['All', 'Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

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

  useEffect(() => {
    fetchJobs();
  }, [page, jobType, expLevel, isRemote, isGov]);

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)', color: '#fff', padding: '3rem 1rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.75rem' }}>Job Marketplace</h1>
        <p style={{ opacity: 0.9, fontSize: '1.125rem', maxWidth: '550px', margin: '0 auto' }}>
          AI-powered matching connecting skilled Liberians with local and remote opportunities.
        </p>
      </div>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem' }} value={jobType} onChange={(e) => { setJobType(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}>
            {JOB_TYPES.map((t) => <option key={t} value={t === 'All' ? '' : t}>{t}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', padding: '0.5rem 0.875rem' }} value={expLevel} onChange={(e) => { setExpLevel(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}>
            {EXP_LEVELS.map((l) => <option key={l} value={l === 'All' ? '' : l}>{l}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isRemote} onChange={(e) => { setIsRemote(e.target.checked); setPage(1); }} />
            Remote
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            <input type="checkbox" checked={isGov} onChange={(e) => { setIsGov(e.target.checked); setPage(1); }} />
            Government Jobs
          </label>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>{total} job{total !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 400px' : '1fr', gap: '1.25rem' }}>
          {/* Job List */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
                <p style={{ color: 'var(--color-text-muted)' }}>No jobs found. Try adjusting filters.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {jobs.map((job) => (
                  <div key={job.id} className="card" style={{ cursor: 'pointer', borderLeft: selectedJob?.id === job.id ? '4px solid var(--color-primary)' : '4px solid transparent', transition: 'all 0.15s' }}
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    onMouseEnter={(e) => { if (selectedJob?.id !== job.id) e.currentTarget.style.borderLeftColor = 'var(--color-border)'; }}
                    onMouseLeave={(e) => { if (selectedJob?.id !== job.id) e.currentTarget.style.borderLeftColor = 'transparent'; }}
                  >
                    <div className="card-body" style={{ padding: '1.125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                            {job.is_government_post && <span className="badge badge-blue">🏛️ Gov</span>}
                            <span className="badge badge-gray">{job.job_type}</span>
                            {job.is_remote && <span className="badge badge-purple">Remote</span>}
                          </div>
                          <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>{job.title}</h3>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {job.employer_name} {job.county && `· ${job.county}`} · {job.experience_level}
                          </div>
                          {(job.salary_min || job.salary_max) && (
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                              {job.salary_negotiable ? 'Negotiable' : `LRD ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}`}
                            </div>
                          )}
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setApplyModal(job); }}>
                          Apply
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {job.skills_required?.slice(0, 4).map((skill) => (
                          <span key={skill} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '0.125rem 0.5rem', fontSize: '0.75rem' }}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>

          {/* Job Detail Panel */}
          {selectedJob && (
            <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{selectedJob.title}</h2>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedJob.employer_name}</div>
                  </div>
                  <button onClick={() => setSelectedJob(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>×</button>
                </div>
                <div className="card-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
                  {selectedJob.requirements?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Requirements</h4>
                      {selectedJob.requirements.map((r, i) => <div key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>• {r}</div>)}
                    </div>
                  )}
                  {selectedJob.skills_required?.length > 0 && (
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Required Skills</h4>
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
                    Apply for This Job
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', animation: 'fadeIn 0.2s ease' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>Apply: {applyModal.title}</h2>
              <button onClick={() => setApplyModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>×</button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Cover Letter (Optional)</label>
                <textarea className="form-input" rows={5} placeholder="Tell them why you're a great fit..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Your profile and CV from your account will be shared with the employer.
              </p>
            </div>
            <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setApplyModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply} disabled={applying} style={{ flex: 2, justifyContent: 'center' }}>
                {applying ? <><span className="spinner" /> Applying...</> : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
