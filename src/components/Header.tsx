import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { downloadCanvasAsPNG, exportAllGroupsAsZip } from '../utils/export';
import { renderMergedGuideCanvas } from '../utils/canvas';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Keyboard, 
  Camera,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2
} from 'lucide-react';

interface HeaderProps {
  onOpenShortcuts: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenShortcuts,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
}) => {
  const {
    images,
    currentIndex,
    annotationsPerImage,
    groups,
    activeGroupId,
    undo,
    redo,
    clearAll,
    canUndo,
    canRedo,
  } = useAppStore();

  const [isZipping, setIsZipping] = useState(false);

  const currentImg = currentIndex >= 0 ? images[currentIndex] : null;
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  const handleExportZip = async () => {
    if (images.length === 0 || isZipping) return;
    try {
      setIsZipping(true);
      await exportAllGroupsAsZip(groups, images, annotationsPerImage);
    } catch (err) {
      console.error('ZIP Export Error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <header className="h-13 shrink-0 select-none relative z-30 flex items-center justify-between px-3 border-b border-white/[0.055]"
      style={{
        background: 'linear-gradient(180deg, rgba(16,16,26,0.98) 0%, rgba(12,12,20,0.96) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.045), 0 1px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Brand ─────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        {/* Logo mark */}
        <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <Camera className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
        </div>

        {/* Text */}
        <div className="flex flex-col leading-none gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[13px] tracking-tight"
              style={{ background: 'linear-gradient(90deg, #ffffff 0%, #c7c9f0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              SnapAnnotate
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded-full border"
              style={{ color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)' }}
            >
              Pro
            </span>
          </div>
          <span className="text-[9.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Screenshot Studio
          </span>
        </div>

        {/* Sidebar toggle */}
        <div className="w-px h-5 mx-1 separator-v" />
        <button
          onClick={onToggleLeftSidebar}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
          style={{
            background: isLeftSidebarOpen ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
            border: isLeftSidebarOpen ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.07)',
            color: isLeftSidebarOpen ? '#818cf8' : 'var(--text-muted)',
          }}
          title={isLeftSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isLeftSidebarOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'; }}
        >
          {isLeftSidebarOpen
            ? <PanelLeftClose className="w-3.5 h-3.5" />
            : <PanelLeftOpen className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* ── Status Pill ──────────────────────────── */}
      <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'var(--text-secondary)',
          maxWidth: 280,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0 breathe"
          style={{ background: currentImg ? '#10b981' : 'var(--text-muted)', boxShadow: currentImg ? '0 0 6px rgba(16,185,129,0.8)' : 'none' }}
        />
        {currentImg ? (
          <>
            <span className="font-medium text-white/80">
              {currentIndex + 1}
              <span className="text-white/30 mx-1">/</span>
              <span className="text-white/30">{images.length}</span>
            </span>
            <span className="truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>{currentImg.name}</span>
          </>
        ) : (
          <span>No screenshots loaded</span>
        )}
      </div>

      {/* ── Actions ──────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: '1px solid transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        <div className="separator-v h-4 mx-0.5" />

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-25 disabled:pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = '#eeeef5'; }}}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-25 disabled:pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color = '#eeeef5'; }}}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Redo</span>
        </button>

        {/* Clear */}
        <button
          onClick={clearAll}
          disabled={currentIndex === -1}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-25 disabled:pointer-events-none"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            color: '#fca5a5',
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; }}}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          title="Clear Annotations"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>

        <div className="separator-v h-4 mx-0.5" />

        {/* Export ZIP — Primary CTA */}
        <button
          onClick={handleExportZip}
          disabled={images.length === 0 || isZipping}
          className="flex items-center gap-2 px-3.5 h-7 rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none btn-shimmer active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 60%, #818cf8 100%)',
            border: '1px solid rgba(129,140,248,0.45)',
            color: '#fff',
            boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 14px rgba(99,102,241,0.35)',
          }}
          title="Export All Groups as ZIP"
        >
          {isZipping
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Archive className="w-3.5 h-3.5" />
          }
          <span>{isZipping ? 'Zipping…' : 'Download ZIP'}</span>
        </button>
      </div>
    </header>
  );
};
