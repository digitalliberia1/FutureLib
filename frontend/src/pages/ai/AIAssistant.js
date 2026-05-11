import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STARTER_PROMPTS = [
  { icon: '📚', text: 'What digital skills courses are available?' },
  { icon: '🚀', text: 'How do I register a startup in Liberia?' },
  { icon: '💰', text: 'What grants can I apply for?' },
  { icon: '🏛️', text: 'How do I apply for a business license online?' },
  { icon: '💼', text: 'How can I find remote work opportunities?' },
  { icon: '🏅', text: 'How do I earn a national digital certificate?' },
];

export default function AIAssistant() {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm **FutureLib AI**, your national digital assistant.\n\nI can help you with:\n• 📚 Finding and enrolling in courses\n• 🏛️ Navigating government services\n• 🚀 Startup registration and funding\n• 💼 Job search and career guidance\n• 💰 Grants and financial support\n\nWhat would you like to know today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    if (!isAuthenticated) { toast.error('Please log in to use AI Assistant'); return; }

    setInput('');
    setSuggestions([]);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai/chat', { message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment. 🔄" }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} style={{ margin: line === '' ? '0.375rem 0' : '0.125rem 0' }} dangerouslySetInnerHTML={{ __html: bold }} />;
    });
  };

  return (
    <DashboardLayout title="✨ FutureLib AI" subtitle="Your national digital assistant powered by AI">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', height: 'calc(100vh - 140px)' }}>
        {/* Chat panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'slideUp 0.2s ease both' }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--blue-700), var(--blue-500))' : 'linear-gradient(135deg, var(--gold-500), var(--gold-400))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: msg.role === 'user' ? '0.75rem' : '1rem', color: '#fff', fontWeight: 800,
                }}>
                  {msg.role === 'user' ? (user?.full_name?.[0] || 'U') : '✨'}
                </div>
                <div style={{
                  maxWidth: '78%',
                  background: msg.role === 'user' ? 'var(--blue-700)' : '#fff',
                  color: msg.role === 'user' ? '#fff' : 'var(--gray-800)',
                  padding: '0.875rem 1.125rem',
                  borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                  border: msg.role === 'assistant' ? '1px solid var(--gray-200)' : 'none',
                  boxShadow: 'var(--shadow-xs)',
                  lineHeight: 1.65,
                  fontSize: '0.9375rem',
                }}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-500), var(--gold-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✨</div>
                <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '4px 18px 18px 18px', padding: '0.875rem 1.125rem', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold-400)', animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ padding: '0 1.5rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)} className="chip">{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about FutureLib services..."
                rows={1}
                style={{
                  flex: 1, padding: '0.75rem 1rem', border: '1.5px solid var(--gray-200)',
                  borderRadius: '12px', fontSize: '0.9375rem', resize: 'none',
                  maxHeight: '120px', fontFamily: 'inherit', background: '#fff',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                  background: input.trim() ? 'var(--blue-700)' : 'var(--gray-200)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.125rem', transition: 'background 0.15s', flexShrink: 0,
                }}
              >
                {loading ? <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', width: '1rem', height: '1rem' }} /> : '↑'}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.5rem', textAlign: 'center' }}>Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card card-body">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.875rem', color: 'var(--gray-700)' }}>💡 Try asking:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {STARTER_PROMPTS.map(p => (
                <button key={p.text} onClick={() => send(p.text)} style={{
                  display: 'flex', gap: '0.5rem', padding: '0.5rem 0.625rem', border: '1.5px solid var(--gray-200)',
                  borderRadius: '8px', background: '#fff', cursor: 'pointer', textAlign: 'left',
                  fontSize: '0.8125rem', color: 'var(--gray-700)', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.background = 'var(--blue-50)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = '#fff'; }}
                >
                  <span style={{ flexShrink: 0 }}>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card card-body" style={{ background: 'linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%)', border: 'none' }}>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>🔗 Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[['📚 Browse Courses', '/learn'], ['🏛️ Gov. Services', '/services'], ['🚀 Startups', '/startups'], ['💼 Jobs', '/jobs']].map(([label, to]) => (
                <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem', textDecoration: 'none', padding: '0.25rem 0', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                >{label}</Link>
              ))}
            </div>
          </div>

          <div className="card card-body" style={{ background: 'var(--gold-100)', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>AI Capabilities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {['Course recommendations', 'Service guidance', 'Business plan tips', 'Grant eligibility', 'Career advice'].map(c => (
                <div key={c} style={{ fontSize: '0.8125rem', color: 'var(--gold-700)', display: 'flex', gap: '0.375rem' }}>
                  <span>✓</span> {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
