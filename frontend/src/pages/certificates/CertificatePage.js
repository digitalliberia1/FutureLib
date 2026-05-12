import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../services/api';

export default function CertificatePage() {
  const { certId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/certificates/verify/${certId}`)
      .then(({ data }) => { setResult(data); setLoading(false); })
      .catch(() => { setResult({ valid: false, message: 'Verification failed' }); setLoading(false); });
  }, [certId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Navbar />

      <div style={{ background: 'linear-gradient(135deg, var(--blue-900), var(--blue-800))', padding: '2.5rem 1.25rem', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏅</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.375rem' }}>Certificate Verification</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9375rem' }}>National Digital Platform of Liberia</p>
      </div>

      <div className="container" style={{ padding: '2.5rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px', margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--gray-500)' }}>Verifying certificate...</div>
          </div>
        ) : result?.valid ? (
          <div style={{ maxWidth: '680px', width: '100%' }}>
            {/* Certificate document */}
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
              {/* Certificate header */}
              <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 50%, var(--red-700) 100%)', padding: '2.5rem', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(245,158,11,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏅</div>
                  <div style={{ color: 'var(--gold-400)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.25rem' }}>Certificate of Completion</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem' }}>FutureLib — National Digital Platform of Liberia</div>
                </div>
              </div>

              {/* Certificate body */}
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>This is to certify that</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--blue-800)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '0.75rem', lineHeight: 1.2 }}>
                  {result.recipient_name}
                </div>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>has successfully completed</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '1rem', padding: '0 1rem', lineHeight: 1.3 }}>{result.course_title}</div>
                {result.course_category && (
                  <span className="badge badge-blue" style={{ marginBottom: '1rem' }}>{result.course_category}</span>
                )}
                <div style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Instructed by</div>
                <div style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: '1.5rem' }}>{result.instructor_name || 'FutureLib Instructor'}</div>

                {result.completed_at && (
                  <div style={{ display: 'inline-block', background: 'var(--gray-50)', borderRadius: '10px', padding: '0.625rem 1.25rem', border: '1px solid var(--gray-200)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Completed on <strong style={{ color: 'var(--gray-800)' }}>{new Date(result.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed var(--gray-200)', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '3rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '1px', background: 'var(--gray-400)', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Minister of Digital Affairs</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '1px', background: 'var(--gray-400)', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Platform Director</div>
                  </div>
                </div>
              </div>

              {/* Verification footer */}
              <div style={{ background: 'var(--green-50)', borderTop: '1px solid #bbf7d0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>✓</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--green-700)', fontSize: '0.875rem' }}>Verified Authentic</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--green-600)' }}>Issued by {result.issued_by}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--green-600)', fontWeight: 600 }}>CERT ID</div>
                  <code style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontFamily: 'monospace' }}>{certId}</code>
                </div>
              </div>
            </div>

            {/* Verification hash */}
            <div className="card card-body" style={{ background: 'var(--gray-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Verification Hash</div>
                  <code style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>{result.verification_hash}</code>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨️ Print</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); }}>🔗 Share Link</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div className="card card-body" style={{ background: 'var(--red-50)', border: '1px solid #fecaca', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--red-700)', marginBottom: '0.75rem' }}>Certificate Not Found</div>
              <div style={{ color: 'var(--red-600)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                {result?.message || 'This certificate ID is invalid or could not be verified.'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--red-500)', marginBottom: '1.5rem' }}>
                Certificate ID: <code style={{ fontFamily: 'monospace' }}>{certId}</code>
              </div>
              <Link to="/" className="btn btn-primary btn-sm">Back to FutureLib</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
