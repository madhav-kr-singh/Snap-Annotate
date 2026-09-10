import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { downloadCanvasAsPNG, exportAllGroupsAsZip } from '../utils/export';
import { renderMergedGuideCanvas } from '../utils/canvas';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  Download, 
  Layers, 
  Keyboard, 
  Camera,
  Archive,
  PanelLeftClose,
  PanelLeftOpen
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

  // Export current single image with annotations
  const handleExportSingle = () => {
    if (currentIndex === -1 || !currentImg) return;
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (canvas) {
      downloadCanvasAsPNG(canvas, `annotated_${currentImg.name.replace(/\.[^/.]+$/, '')}`);
    }
  };

  // Export active composite merged guide canvas
  const handleExportMerged = () => {
    if (!activeGroup) return;
    const groupImages = images.filter((img) => activeGroup.imageIds.includes(img.id));
    const targetImages = groupImages.length > 0 ? groupImages : images;
    if (targetImages.length === 0) return;

    const groupAnnotations: Record<number, any> = {};
    targetImages.forEach((img, idx) => {
      const originalIdx = images.findIndex((i) => i.id === img.id);
      groupAnnotations[idx] = annotationsPerImage[originalIdx] || [];
    });

    const mergedCanvas = renderMergedGuideCanvas(targetImages, groupAnnotations, activeGroup);
    downloadCanvasAsPNG(mergedCanvas, `${activeGroup.name.replace(/\s+/g, '_')}_guide`);
  };

  // Export all groups in a single ZIP file with clean filenames (1.png, 2.png, 3.png...)
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
    <header className="h-14 bg-[#121212]/95 border-b border-white/10 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
       

        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200">
              SnapAnnotate
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Pro Studio
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Screenshot & Documentation Workbench</span>
        </div>
         {/* Toggle Left Sidebar */}
        <button
          onClick={onToggleLeftSidebar}
          className={`p-2 rounded-lg transition-all border cursor-pointer ${
            isLeftSidebarOpen
              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={isLeftSidebarOpen ? 'Hide Left Sidebar (Ctrl+[)' : 'Show Left Sidebar (Ctrl+[)'}
        >
          {isLeftSidebarOpen ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Document / Image Status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a]/80 border border-white/5 text-xs text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        {currentImg ? (
          <span>
            <strong className="text-white font-medium">Image {currentIndex + 1} of {images.length}:</strong>{' '}
            <span className="text-slate-400 truncate max-w-[200px] inline-block align-bottom">{currentImg.name}</span>
          </span>
        ) : (
          <span className="text-slate-400">No screenshots loaded</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all border border-white/5"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all border border-white/5"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Redo</span>
        </button>

        {/* Clear */}
        <button
          onClick={clearAll}
          disabled={currentIndex === -1}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Clear Annotations"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Export Single (Commented out per user request)
        <button
          onClick={handleExportSingle}
          disabled={currentIndex === -1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/30 border border-indigo-400/30 active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PNG</span>
        </button>
        */}

        {/* Export Composite Merged Guide (Commented out per user request)
        <button
          onClick={handleExportMerged}
          disabled={images.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-emerald-600/30 border border-emerald-400/30 active:scale-[0.98]"
          title="Export Composite Merged Multi-Image Guide Stack"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Export Merged Guide</span>
          <span className="lg:hidden">Merged</span>
        </button>
        */}

        {/* Export All Groups ZIP (Primary Top Right Action) */}
        <button
          onClick={handleExportZip}
          disabled={images.length === 0 || isZipping}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98] cursor-pointer"
          title="Export All Groups as ZIP (Files named 1.png, 2.png, 3.png...)"
        >
          <Archive className={`w-4 h-4 ${isZipping ? 'animate-spin' : ''}`} />
          <span>{isZipping ? 'Zipping...' : 'Download ZIP'}</span>
        </button>
      </div>
    </header>
  );
};
