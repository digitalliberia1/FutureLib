import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/authSlice';
import toast from 'react-hot-toast';

const COUNTIES = [
  'Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh',
  'Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba',
  'Rivercess','River Gee','Sinoe',
];

const ROLES = [
  { value: 'citizen', label: 'Citizen', desc: 'Learn, apply for services, and grow' },
  { value: 'startup_founder', label: 'Startup Founder', desc: 'Register and grow your startup' },
  { value: 'educator', label: 'Educator', desc: 'Create and teach courses' },
  { value: 'investor', label: 'Investor', desc: 'Discover and fund Liberian startups' },
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '',
    role: 'citizen', county: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    dispatch(clearError());
    setLocalError('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return setLocalError('Please enter your full name');
    if (!form.email) return setLocalError('Please enter your email');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return setLocalError('Passwords do not match');
    if (form.password.length < 8) return setLocalError('Password must be at least 8 characters');

    const result = await dispatch(register({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      role: form.role,
      county: form.county || undefined,
    }));

    if (register.fulfilled.match(result)) {
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.5rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🇱🇷</span> FutureLib
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.375rem' }}>Create your account</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Join thousands of Liberians building the future</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '9999px', background: step >= s ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>

        <div className="card">
          <div className="card-body">
            {(error || localError) && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--color-error)', fontSize: '0.875rem' }}>
                {error || localError}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleNext}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input name="full_name" type="text" className="form-input" placeholder="John Doe" value={form.full_name} onChange={handleChange} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input name="email" type="email" className="form-input" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input name="phone" type="tel" className="form-input" placeholder="+231 77 123 4567" value={form.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">County</label>
                  <select name="county" className="form-input" value={form.county} onChange={handleChange}>
                    <option value="">Select County</option>
                    {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">I am registering as *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {ROLES.map((r) => (
                      <label key={r.value} style={{
                        display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        padding: '0.75rem', border: `2px solid ${form.role === r.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)', cursor: 'pointer',
                        background: form.role === r.value ? '#eff6ff' : 'transparent',
                        transition: 'all 0.15s',
                      }}>
                        <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={handleChange} style={{ display: 'none' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.label}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Continue →
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input name="password" type="password" className="form-input" placeholder="At least 8 characters" value={form.password} onChange={handleChange} required autoFocus />
                  <span className="form-hint">Must include uppercase letter and number</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input name="confirm_password" type="password" className="form-input" placeholder="Repeat your password" value={form.confirm_password} onChange={handleChange} required />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: '0 0 auto' }}>← Back</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                    {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="card-footer" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
