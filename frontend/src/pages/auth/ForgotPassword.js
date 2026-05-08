import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent if that email is registered');
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.5rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🇱🇷</span> FutureLib
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.375rem' }}>Reset Password</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Enter your email to receive a reset link</p>
        </div>

        <div className="card">
          <div className="card-body">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Check your email</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
                </p>
                <Link to="/login" className="btn btn-outline">← Back to Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
          <div className="card-footer" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
