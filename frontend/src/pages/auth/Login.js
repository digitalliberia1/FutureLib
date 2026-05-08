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

  const handleChange = (e) => {
    dispatch(clearError());
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email: form.email, password: form.password, mfa_code: form.mfa_code || undefined }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else if (result.payload === 'MFA code required') {
      setNeedsMfa(true);
      toast('Enter your MFA code to continue', { icon: '🔐' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.5rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🇱🇷</span> FutureLib
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.375rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Sign in to your FutureLib account</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--color-error)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.8125rem' }}>Forgot password?</Link>
                </div>
                <input
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {needsMfa && (
                <div className="form-group">
                  <label className="form-label">MFA Code</label>
                  <input
                    name="mfa_code"
                    type="text"
                    className="form-input"
                    placeholder="6-digit code"
                    value={form.mfa_code}
                    onChange={handleChange}
                    maxLength={6}
                    autoFocus
                  />
                  <span className="form-hint">Enter the code from your authenticator app</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="card-footer" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 700 }}>Create one for free</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          By signing in, you agree to the{' '}
          <Link to="#">Terms of Service</Link> and <Link to="#">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
