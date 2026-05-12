/**
 * OpenEdxPlayer — embeds the Open edX course player inside FutureLib's custom UI.
 *
 * Two modes:
 *   1. IFRAME mode (default): Renders a full-screen iframe pointed at the Open edX
 *      LMS course page after the user has been SSO'd in. The user experiences the
 *      original Open edX player but surrounded by FutureLib chrome.
 *
 *   2. BLOCKS mode: Uses the /api/courses/v1/blocks/ API to render a lightweight
 *      custom outline + embeds individual unit iframes. Falls back to IFRAME mode
 *      if blocks are unavailable.
 *
 * Usage:
 *   <OpenEdxPlayer courseId="course-v1:Org+CourseName+Run" ssoUrl="..." />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getLmsSsoUrl, getCourseBlocks, getCompletionSummary, extractProgressPercent } from '../../services/openedxApi';

const PLAYER_HEIGHT = 'calc(100vh - 56px)';

export default function OpenEdxPlayer({ courseId, onProgressUpdate }) {
  const [ssoUrl, setSsoUrl] = useState(null);
  const [blocks, setBlocks] = useState(null);
  const [currentBlockUrl, setCurrentBlockUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState('iframe'); // 'iframe' | 'blocks'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const iframeRef = useRef(null);

  const coursePlayerUrl = ssoUrl
    ? `${ssoUrl}&next=/courses/${encodeURIComponent(courseId)}/courseware`
    : null;

  const loadPlayer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch SSO URL (provisions user if first time)
      const { sso_url } = await getLmsSsoUrl(`/courses/${encodeURIComponent(courseId)}/courseware`);
      setSsoUrl(sso_url);

      // Try to fetch block tree for custom outline
      try {
        const blockData = await getCourseBlocks(courseId);
        if (blockData?.blocks) {
          setBlocks(blockData);
          setMode('blocks');
          // Start at the first unit
          const units = Object.values(blockData.blocks).filter(b => b.type === 'vertical');
          if (units.length > 0) {
            setCurrentBlockUrl(units[0].student_view_url);
          }
        }
      } catch {
        // Blocks unavailable — fall back to full iframe
        setMode('iframe');
      }

      // Load completion data
      try {
        const completion = await getCompletionSummary(courseId);
        const pct = extractProgressPercent(completion);
        setProgress(pct);
        onProgressUpdate?.(pct);
      } catch {
        // progress non-critical
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load course player.');
    } finally {
      setLoading(false);
    }
  }, [courseId, onProgressUpdate]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  if (loading) return <PlayerSkeleton />;
  if (error) return <PlayerError message={error} onRetry={loadPlayer} />;

  // ── BLOCKS mode: custom sidebar + unit iframe ──────────────────────────────
  if (mode === 'blocks' && blocks) {
    const chapters = Object.values(blocks.blocks).filter(b => b.type === 'chapter');
    return (
      <div style={{ display: 'flex', height: PLAYER_HEIGHT, background: '#0d1526' }}>
        {/* Collapsible outline sidebar */}
        {sidebarOpen && (
          <aside style={{
            width: '280px', flexShrink: 0, background: '#0a1020',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Course Content</div>
              <ProgressBar percent={progress} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
              {chapters.map(chapter => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  blocks={blocks.blocks}
                  currentBlockUrl={currentBlockUrl}
                  onSelectUnit={url => setCurrentBlockUrl(url)}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10 }}>
            <button
              onClick={() => setSidebarOpen(s => !s)}
              style={sidebarToggleStyle}
              title={sidebarOpen ? 'Collapse outline' : 'Expand outline'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {currentBlockUrl ? (
            <iframe
              ref={iframeRef}
              src={currentBlockUrl}
              title="Course Unit"
              style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
              allow="fullscreen; microphone; camera"
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
              Select a unit to begin
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── IFRAME mode: full Open edX LMS embed ────────────────────────────────────
  return (
    <div style={{ position: 'relative', height: PLAYER_HEIGHT }}>
      {/* Progress ribbon */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, height: '3px' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--blue-500), var(--green-400))', width: `${progress}%`, transition: 'width 0.6s ease' }} />
      </div>

      <iframe
        ref={iframeRef}
        src={coursePlayerUrl}
        title="Open edX Course Player"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="fullscreen; microphone; camera; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChapterItem({ chapter, blocks, currentBlockUrl, onSelectUnit }) {
  const [open, setOpen] = useState(true);
  const sequentials = (chapter.children || []).map(id => blocks[id]).filter(Boolean);

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.8125rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {chapter.display_name}
        </span>
        <span style={{ marginLeft: '0.5rem', opacity: 0.5, fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && sequentials.map(seq => (
        <SequentialItem key={seq.id} sequential={seq} blocks={blocks} currentBlockUrl={currentBlockUrl} onSelectUnit={onSelectUnit} />
      ))}
    </div>
  );
}

function SequentialItem({ sequential, blocks, currentBlockUrl, onSelectUnit }) {
  const [open, setOpen] = useState(false);
  const units = (sequential.children || []).map(id => blocks[id]).filter(b => b?.type === 'vertical');

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '0.5rem 1rem 0.5rem 1.5rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{open ? '▼' : '▶'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sequential.display_name}
        </span>
      </button>

      {open && units.map(unit => {
        const isActive = unit.student_view_url === currentBlockUrl;
        const isComplete = unit.complete;
        return (
          <button
            key={unit.id}
            onClick={() => onSelectUnit(unit.student_view_url)}
            style={{
              width: '100%', textAlign: 'left', padding: '0.4375rem 1rem 0.4375rem 2.25rem',
              background: isActive ? 'rgba(59,130,246,0.15)' : 'none',
              border: 'none', borderLeft: isActive ? '2px solid var(--blue-500)' : '2px solid transparent',
              cursor: 'pointer', color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: '0.7875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <span style={{ color: isComplete ? 'var(--green-400)' : 'rgba(255,255,255,0.2)', fontSize: '0.7rem', flexShrink: 0 }}>
              {isComplete ? '✓' : '○'}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {unit.display_name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.375rem' }}>
        <span>Progress</span><span>{percent}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--blue-500), var(--green-400))', width: `${percent}%`, borderRadius: '9999px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div style={{ height: PLAYER_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1526' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--blue-400)', margin: '0 auto 1rem' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Loading course player…</div>
      </div>
    </div>
  );
}

function PlayerError({ message, onRetry }) {
  return (
    <div style={{ height: PLAYER_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1526' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Course Player Unavailable</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{message}</div>
        <button
          onClick={onRetry}
          className="btn btn-primary btn-sm"
          style={{ background: 'var(--blue-600)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

const sidebarToggleStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.6)',
  padding: '0.375rem 0.625rem',
  fontSize: '0.75rem',
};
