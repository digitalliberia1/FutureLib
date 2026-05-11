import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/authSlice';
import toast from 'react-hot-toast';

const COUNTIES = ['Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh','Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba','Rivercess','River Gee','Sinoe'];

const ROLES = [
  { value: 'citizen', icon: '👤', label: 'Citizen', desc: 'Access learning, jobs & government services' },
  { value: 'startup_founder', icon: '🚀', label: 'Founder', desc: 'Register startup, apply for funding' },
  { value: 'educator', icon: '🎓', label: 'Educator', desc: 'Create and publish certified courses' },
  { value: 'investor', icon: '💼', label: 'Investor', desc: 'Discover and fund Liberian startups' },
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'citizen', county: '' });
  const [localError, setLocalError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => { dispatch(clearError()); setLocalError(''); setForm(f => ({ ...f, [k]: e.target.value })); };

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return setLocalError('Please enter your full name');
    if (!form.email) return setLocalError('Please enter a valid email');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return setLocalError('Passwords do not match');
    if (form.password.length < 8) return setLocalError('Password must be at least 8 characters');
    if (!/[A-Z]/.test(form.password)) return setLocalError('Password must contain an uppercase letter');
    if (!/[0-9]/.test(form.password)) return setLocalError('Password must contain a number');

    const result = await dispatch(register({ full_name: form.full_name, email: form.email, phone: form.phone || undefined, password: form.password, role: form.role, county: form.county || undefined }));
    if (register.fulfilled.match(result)) {
      toast.success('Account created! Please check your email to verify.');
      navigate('/login');
    }
  };

  const displayError = error || localError;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '3rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #C8102E, #1A3A6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🇱🇷</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.375rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Future<span style={{ color: 'var(--gold-400)' }}>Lib</span></span>
          </Link>
          <h2 style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Join Liberia's<br />Digital Revolution
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '2.5rem' }}>
            Thousands of citizens, founders, and educators are already using FutureLib to build a better Liberia.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[['10K+', 'Registered users'], ['200+', 'Courses'], ['50+', 'Gov. services'], ['15', 'Counties covered']].map(([v, l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: 'var(--gold-400)', fontWeight: 900, fontSize: '1.375rem', lineHeight: 1 }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-50)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '9999px', background: step >= s ? 'var(--blue-700)' : 'var(--gray-200)', transition: 'background 0.3s' }} />
              ))}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{step === 1 ? 'Create your account' : 'Set your password'}</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              {step === 1 ? 'Step 1 of 2 — Your details' : 'Step 2 of 2 — Secure your account'} ·{' '}
              Already have one? <Link to="/login" style={{ fontWeight: 700, color: 'var(--blue-700)' }}>Sign in</Link>
            </p>
          </div>

          {displayError && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span> {displayError}
            </div>
          )}

          <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="card-body">
              {step === 1 ? (
                <form onSubmit={handleNext}>
                  <div className="form-group">
                    <label className="form-label form-label-req">Full Name</label>
                    <div className="input-group">
                      <span className="input-icon">👤</span>
                      <input type="text" className="form-input" placeholder="e.g. Mary Kollie" value={form.full_name} onChange={set('full_name')} required autoFocus />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-req">Email Address</label>
                    <div className="input-group">
                      <span className="input-icon">✉️</span>
                      <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div className="input-group">
                      <span className="input-icon">📱</span>
                      <input type="tel" className="form-input" placeholder="+231 77 123 4567" value={form.phone} onChange={set('phone')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">County</label>
                    <select className="form-input" value={form.county} onChange={set('county')}>
                      <option value="">Select your county</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label form-label-req">I am registering as</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {ROLES.map(r => (
                        <label key={r.value} style={{
                          border: `2px solid ${form.role === r.value ? 'var(--blue-700)' : 'var(--gray-200)'}`,
                          borderRadius: '10px', padding: '0.875rem', cursor: 'pointer',
                          background: form.role === r.value ? 'var(--blue-50)' : '#fff',
                          transition: 'all 0.15s', display: 'block',
                        }}>
                          <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} style={{ display: 'none' }} />
                          <div style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>{r.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: form.role === r.value ? 'var(--blue-700)' : 'var(--gray-800)' }}>{r.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem', lineHeight: 1.4 }}>{r.desc}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>
                    Continue →
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label form-label-req">Password</label>
                    <div className="input-group" style={{ position: 'relative' }}>
                      <span className="input-icon">🔒</span>
                      <input type={showPw ? 'text' : 'password'} className="form-input" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required autoFocus />
                      <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                        {showPw ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      {[['8+ chars', form.password.length >= 8], ['Uppercase', /[A-Z]/.test(form.password)], ['Number', /[0-9]/.test(form.password)]].map(([label, ok]) => (
                        <span key={label} style={{ fontSize: '0.75rem', fontWeight: 600, color: ok ? 'var(--green-600)' : 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {ok ? '✓' : '○'} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label form-label-req">Confirm Password</label>
                    <div className="input-group">
                      <span className="input-icon">🔒</span>
                      <input type="password" className="form-input" placeholder="Repeat your password" value={form.confirm_password} onChange={set('confirm_password')} required />
                    </div>
                    {form.confirm_password && (
                      <span style={{ fontSize: '0.8125rem', color: form.password === form.confirm_password ? 'var(--green-600)' : 'var(--red-500)', fontWeight: 600 }}>
                        {form.password === form.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>
                  <div style={{ background: 'var(--blue-50)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: 'var(--blue-700)' }}>
                    🔐 Your account: <strong>{form.full_name}</strong> · <strong>{ROLES.find(r => r.value === form.role)?.label}</strong> {form.county && `· ${form.county}`}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: '0 0 auto', border: '1.5px solid var(--gray-200)' }}>← Back</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }} disabled={loading}>
                      {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
            By creating an account, you agree to our <Link to="#" style={{ color: 'var(--gray-500)' }}>Terms</Link> and <Link to="#" style={{ color: 'var(--gray-500)' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
