import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const relTime = (dt) => {
  if (!dt) return '—';
  const s = Math.floor((Date.now() - new Date(dt)) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
};

const CAT_ICONS = {
  GENERAL: '💬', COURSE: '📚', CAREER: '💼', STARTUP: '🚀',
  GOVERNMENT: '🏛️', TECH: '💻', ANNOUNCEMENTS: '📢',
};

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  border: '1px solid var(--gray-200)', marginBottom: '1rem',
  boxSizing: 'border-box', fontSize: '0.9rem',
};

function Initials({ name, size = 36 }) {
  const initials = (name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#1A3A6B', '#C8102E', '#059669', '#7C3AED', '#0891B2', '#D97706'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ maxWidth: '560px', margin: 'auto', marginTop: '80px', marginBottom: '80px', padding: '2rem', borderRadius: '16px', background: '#fff', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--gray-900)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CommunityForum() {
  const { user } = useSelector(s => s.auth);
  const isAuth = !!user;

  const [forumStats, setForumStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [threads, setThreads] = useState([]);
  const [threadsTotal, setThreadsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  const [selectedThread, setSelectedThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [threadUpvotes, setThreadUpvotes] = useState(0);

  const [replyOpen, setReplyOpen] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [bottomReply, setBottomReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [threadForm, setThreadForm] = useState({ title: '', category: '', body: '', tags: '', course_id: '' });
  const [threadSuccess, setThreadSuccess] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/forum/stats').catch(() => ({ data: null })).then(r => setForumStats(r.data));
    api.get('/forum/categories').catch(() => ({ data: [] })).then(r => setCategories(r.data?.results || r.data || []));
  }, []);

  useEffect(() => {
    fetchThreads(1);
  }, [selectedCategory, sortBy]);

  const fetchThreads = async (p) => {
    setLoading(true);
    try {
      const params = { page: p, page_size: 15 };
      if (selectedCategory) params.category = selectedCategory;
      if (sortBy === 'most_replies') params.ordering = '-reply_count';
      else if (sortBy === 'most_views') params.ordering = '-view_count';
      else params.ordering = '-created_at';
      const { data } = await api.get('/forum/threads', { params });
      setThreads(data?.results || data?.threads || data || []);
      setThreadsTotal(data?.total || data?.count || 0);
      setPage(p);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (thread) => {
    setSelectedThread(thread);
    setThreadUpvotes(thread.upvote_count || thread.upvotes || 0);
    setPostsLoading(true);
    try {
      const { data } = await api.get(`/forum/threads/${thread.id}/posts`);
      setThreadPosts(data?.results || data?.posts || data || []);
    } catch {
      setThreadPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const upvoteThread = async () => {
    try {
      const { data } = await api.post(`/forum/threads/${selectedThread.id}/upvote`);
      setThreadUpvotes(data?.upvote_count || data?.upvotes || (threadUpvotes + 1));
    } catch { /* ignore */ }
  };

  const upvotePost = async (postId, idx) => {
    try {
      const { data } = await api.post(`/forum/posts/${postId}/upvote`);
      setThreadPosts(posts => posts.map((p, i) => i === idx ? { ...p, upvote_count: data?.upvote_count || (p.upvote_count || 0) + 1 } : p));
    } catch { /* ignore */ }
  };

  const submitBottomReply = async () => {
    if (!bottomReply.trim()) return;
    setSubmittingReply(true);
    try {
      const { data } = await api.post(`/forum/threads/${selectedThread.id}/posts`, { body: bottomReply, parent_post_id: null });
      setThreadPosts(posts => [...posts, data]);
      setBottomReply('');
    } catch { /* ignore */ } finally {
      setSubmittingReply(false);
    }
  };

  const submitNestedReply = async (parentPostId) => {
    const body = replyTexts[parentPostId];
    if (!body?.trim()) return;
    try {
      const { data } = await api.post(`/forum/threads/${selectedThread.id}/posts`, { body, parent_post_id: parentPostId });
      setThreadPosts(posts => [...posts, data]);
      setReplyTexts(t => ({ ...t, [parentPostId]: '' }));
      setReplyOpen(o => ({ ...o, [parentPostId]: false }));
    } catch { /* ignore */ }
  };

  const submitThread = async () => {
    if (!threadForm.title || !threadForm.body || threadForm.body.length < 20) {
      setThreadError('Title and body (min 20 characters) are required.');
      return;
    }
    setSubmitting(true);
    setThreadError('');
    try {
      const payload = {
        title: threadForm.title,
        category: threadForm.category,
        body: threadForm.body,
        tags: threadForm.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (threadForm.course_id) payload.course_id = threadForm.course_id;
      await api.post('/forum/threads', payload);
      setThreadSuccess(true);
      setTimeout(() => { setShowNewThreadModal(false); setThreadSuccess(false); setThreadForm({ title: '', category: '', body: '', tags: '', course_id: '' }); fetchThreads(1); }, 1500);
    } catch (e) {
      setThreadError(e?.response?.data?.detail || 'Failed to create thread.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredThreads = searchQuery
    ? threads.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : threads;

  const totalPages = Math.ceil(threadsTotal / 15);

  const renderPost = (post, idx, depth = 0) => {
    const isOpen = replyOpen[post.id];
    const replies = threadPosts.filter(p => p.parent_post_id === post.id);
    return (
      <div key={post.id || idx} style={{ marginLeft: depth > 0 ? '2rem' : 0, borderLeft: depth > 0 ? '2px solid var(--gray-200)' : 'none', paddingLeft: depth > 0 ? '1rem' : 0 }}>
        <div style={{ background: depth === 0 ? '#fff' : 'var(--gray-50)', borderRadius: '10px', border: '1px solid var(--gray-100)', padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Initials name={post.author_name || post.author} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-900)' }}>{post.author_name || post.author}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{relTime(post.created_at)}</span>
                {post.is_accepted_answer && (
                  <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: '6px', padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 800 }}>✓ Accepted Answer</span>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--gray-700)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: '0.75rem' }}>{post.body}</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => upvotePost(post.id, idx)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '0.25rem 0.625rem', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600, color: 'var(--gray-600)' }}>
                  ▲ {post.upvote_count || post.upvotes || 0}
                </button>
                {isAuth && (
                  <button onClick={() => setReplyOpen(o => ({ ...o, [post.id]: !o[post.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--blue-700)', fontWeight: 600 }}>
                    Reply
                  </button>
                )}
              </div>
              {isOpen && (
                <div style={{ marginTop: '0.75rem' }}>
                  <textarea
                    value={replyTexts[post.id] || ''}
                    onChange={e => setReplyTexts(t => ({ ...t, [post.id]: e.target.value }))}
                    placeholder="Write a reply..."
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setReplyOpen(o => ({ ...o, [post.id]: false }))}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => submitNestedReply(post.id)} disabled={!replyTexts[post.id]?.trim()}>Post Reply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {replies.map((r, j) => renderPost(r, j, depth + 1))}
      </div>
    );
  };

  return (
    <DashboardLayout title="Community Forum" subtitle="Connect, Learn & Grow Together">
      {/* Hero strip */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', borderRadius: '16px', padding: '1.75rem 2.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>FUTURELIB COMMUNITY</div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#fff', marginBottom: '0.375rem' }}>💬 FutureLib Community</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Connect with Liberians, share knowledge, and grow together</p>
        </div>
        {forumStats && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#fff' }}>{(forumStats.total_threads || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Threads</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#fff' }}>{(forumStats.total_posts || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Posts</div>
            </div>
          </div>
        )}
        {isAuth && (
          <button className="btn btn-sm" style={{ background: 'var(--gold-400)', color: '#000', fontWeight: 800, marginLeft: forumStats ? '1rem' : 'auto' }} onClick={() => setShowNewThreadModal(true)}>+ New Thread</button>
        )}
      </div>

      {selectedThread ? (
        /* Single Thread View */
        <div>
          <button onClick={() => { setSelectedThread(null); setThreadPosts([]); }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--blue-700)', fontSize: '0.9rem', marginBottom: '1.25rem', padding: 0 }}>
            ← Back to Forum
          </button>

          {/* Thread Header */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid var(--gray-200)', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.875rem', alignItems: 'center' }}>
              {selectedThread.category && (
                <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{CAT_ICONS[selectedThread.category] || '💬'} {selectedThread.category}</span>
              )}
            </div>
            <h2 style={{ fontWeight: 900, fontSize: '1.375rem', color: 'var(--gray-900)', marginBottom: '0.75rem', lineHeight: 1.35 }}>{selectedThread.title}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Initials name={selectedThread.author_name || selectedThread.author} size={28} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{selectedThread.author_name || selectedThread.author}</span>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>{relTime(selectedThread.created_at)}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>👁 {selectedThread.view_count || 0} views</span>
              <button onClick={upvoteThread} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--blue-50)', border: '1px solid var(--blue-200)', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 700, color: 'var(--blue-700)' }}>
                ▲ {threadUpvotes}
              </button>
            </div>
            {selectedThread.body && (
              <div style={{ fontSize: '0.9375rem', color: 'var(--gray-700)', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '0.875rem' }}>{selectedThread.body}</div>
            )}
            {selectedThread.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {selectedThread.tags.map((tag, i) => (
                  <span key={i} className="chip" style={{ fontSize: '0.75rem' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Posts */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-700)', marginBottom: '0.875rem' }}>
              {postsLoading ? 'Loading replies...' : `${threadPosts.filter(p => !p.parent_post_id).length} Replies`}
            </div>
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '10px', marginBottom: '0.75rem' }} />)
            ) : threadPosts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-100)' }}>No replies yet. Be the first to reply!</div>
            ) : (
              threadPosts.filter(p => !p.parent_post_id).map((post, idx) => renderPost(post, idx, 0))
            )}
          </div>

          {/* Reply box at bottom */}
          {isAuth && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)', marginBottom: '0.75rem' }}>Write a Reply</div>
              <textarea
                value={bottomReply}
                onChange={e => setBottomReply(e.target.value)}
                placeholder="Write a reply..."
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={submitBottomReply} disabled={submittingReply || !bottomReply.trim()}>
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Thread List View */
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <div style={{ width: '240px', flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-700)' }}>Categories</div>
              <div>
                <button onClick={() => setSelectedCategory('')} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: !selectedCategory ? 'var(--blue-50)' : 'transparent', color: !selectedCategory ? 'var(--blue-700)' : 'var(--gray-700)', fontWeight: !selectedCategory ? 800 : 600, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: !selectedCategory ? '3px solid var(--blue-700)' : '3px solid transparent' }}>
                  💬 All Discussions
                </button>
                {categories.map(cat => {
                  const catName = cat.name || cat;
                  const isSelected = selectedCategory === catName;
                  return (
                    <button key={catName} onClick={() => setSelectedCategory(catName)} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: 'none', background: isSelected ? 'var(--blue-50)' : 'transparent', color: isSelected ? 'var(--blue-700)' : 'var(--gray-700)', fontWeight: isSelected ? 800 : 600, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: isSelected ? '3px solid var(--blue-700)' : '3px solid transparent' }}>
                      {CAT_ICONS[catName] || '💬'} {catName.charAt(0) + catName.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Search + Sort */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.875rem' }}
              />
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
                {[{ id: 'latest', label: 'Latest' }, { id: 'most_replies', label: 'Most Replies' }, { id: 'most_views', label: 'Most Views' }].map(s => (
                  <button key={s.id} onClick={() => setSortBy(s.id)} style={{ padding: '0.5rem 0.875rem', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700, background: sortBy === s.id ? 'var(--blue-700)' : '#fff', color: sortBy === s.id ? '#fff' : 'var(--gray-600)' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread List */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <div className="skeleton" style={{ height: '14px', width: '70%', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '12px', width: '40%' }} />
                  </div>
                ))
              ) : filteredThreads.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem' }}>
                  <div className="empty-icon">💬</div>
                  <div className="empty-title">No threads yet</div>
                  <div className="empty-desc">Be the first to start a discussion</div>
                </div>
              ) : filteredThreads.map((thread, i) => (
                <div key={thread.id || i} onClick={() => openThread(thread)} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', borderLeft: thread.is_pinned ? '3px solid var(--gold-400)' : '3px solid transparent', background: thread.is_pinned ? '#fffbeb' : 'transparent', transition: 'background 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = thread.is_pinned ? '#fef3c7' : 'var(--gray-50)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = thread.is_pinned ? '#fffbeb' : 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      {thread.is_pinned && <span style={{ fontSize: '0.875rem' }} title="Pinned">📌</span>}
                      <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--gray-900)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{thread.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {thread.category && (
                        <span className="badge badge-blue" style={{ fontSize: '0.67rem' }}>{CAT_ICONS[thread.category] || '💬'} {thread.category}</span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{thread.author_name || thread.author}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{relTime(thread.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-700)' }}>{thread.reply_count || thread.post_count || 0}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>replies</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-700)' }}>{thread.view_count || 0}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>views</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => fetchThreads(page - 1)}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => fetchThreads(page + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <Modal title="💬 Start a New Discussion" onClose={() => { setShowNewThreadModal(false); setThreadError(''); setThreadSuccess(false); }}>
          {threadSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 700 }}>✓ Thread created successfully!</div>}
          {threadError && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{threadError}</div>}
          <input style={inputStyle} placeholder="Thread Title *" value={threadForm.title} onChange={e => setThreadForm(f => ({ ...f, title: e.target.value }))} />
          <select style={inputStyle} value={threadForm.category} onChange={e => setThreadForm(f => ({ ...f, category: e.target.value }))}>
            <option value="">Select Category</option>
            {categories.map(cat => {
              const catName = cat.name || cat;
              return <option key={catName} value={catName}>{CAT_ICONS[catName] || '💬'} {catName}</option>;
            })}
            {Object.keys(CAT_ICONS).filter(k => !categories.some(c => (c.name || c) === k)).map(k => (
              <option key={k} value={k}>{CAT_ICONS[k]} {k}</option>
            ))}
          </select>
          <textarea style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} placeholder="Write your post here... (min 20 characters)" value={threadForm.body} onChange={e => setThreadForm(f => ({ ...f, body: e.target.value }))} />
          <input style={inputStyle} placeholder="Tags (comma-separated, optional)" value={threadForm.tags} onChange={e => setThreadForm(f => ({ ...f, tags: e.target.value }))} />
          <input style={inputStyle} placeholder="Course ID (optional)" value={threadForm.course_id} onChange={e => setThreadForm(f => ({ ...f, course_id: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setShowNewThreadModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitThread} disabled={submitting || !threadForm.title}>{submitting ? 'Posting...' : 'Post Thread'}</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
