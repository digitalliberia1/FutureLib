import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/authSlice';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '', mfa_code: '' });
  const [needsMfa, setNeedsMfa] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => { dispatch(clearError()); setForm(f => ({ ...f, [k]: e.target.value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email: form.email, password: form.password, mfa_code: form.mfa_code || undefined }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back to FutureLib!');
      navigate('/dashboard');
    } else if (result.payload === 'MFA code required') {
      setNeedsMfa(true);
      toast('Enter your 2FA code to continue', { icon: '🔐' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left panel */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 60%, #1a1028 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', marginBottom: '3rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #C8102E, #1A3A6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🇱🇷</div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.375rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Future<span style={{ color: 'var(--gold-400)' }}>Lib</span></span>
          </Link>
          <h2 style={{ color: '#fff', fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome back to<br />Liberia's digital hub
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '2.5rem', fontSize: '1rem' }}>
            Sign in to continue learning, growing your startup, accessing government services, and building Liberia's future.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {['📚 200+ government-certified courses', '🏛️ 50+ digital government services', '🚀 National startup ecosystem', '✨ AI-powered guidance'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold-400)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--gray-50)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.375rem', color: 'var(--gray-900)' }}>Sign in</h1>
            <p style={{ color: 'var(--gray-500)' }}>Don't have an account? <Link to="/register" style={{ fontWeight: 700, color: 'var(--blue-700)' }}>Register for free</Link></p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <div className="input-group">
                    <span className="input-icon">✉️</span>
                    <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} required autoFocus />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--blue-600)', fontWeight: 600 }}>Forgot?</Link>
                  </div>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <span className="input-icon">🔒</span>
                    <input type={showPw ? 'text' : 'password'} className="form-input" placeholder="Your password" value={form.password} onChange={set('password')} required />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {needsMfa && (
                  <div className="form-group">
                    <label className="form-label">Two-Factor Code</label>
                    <div className="input-group">
                      <span className="input-icon">🔐</span>
                      <input type="text" className="form-input" placeholder="6-digit code" value={form.mfa_code} onChange={set('mfa_code')} maxLength={6} autoFocus inputMode="numeric" />
                    </div>
                    <span className="form-hint">Enter the code from your authenticator app</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem', padding: '0.75rem' }} disabled={loading}>
                  {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In →'}
                </button>
              </form>

              <div className="divider-text">or continue with</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ border: '1.5px solid var(--gray-200)', fontSize: '0.875rem' }}>🌐 Google</button>
                <button className="btn btn-ghost" style={{ border: '1.5px solid var(--gray-200)', fontSize: '0.875rem' }}>📘 Facebook</button>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
            By signing in, you agree to our{' '}
            <Link to="#" style={{ color: 'var(--gray-500)' }}>Terms</Link> and{' '}
            <Link to="#" style={{ color: 'var(--gray-500)' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Mobile fallback */}
      <style>{`@media (max-width: 768px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } div[style*="background: linear-gradient(135deg, var(--blue-900)"] { display: none !important; } }`}</style>
    </div>
  );
}
