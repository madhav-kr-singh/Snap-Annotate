import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutList = [
    { key: 'Ctrl + [', action: 'Toggle Left Sidebar (Hide/Show)' },
    { key: '← / → Arrow Keys', action: 'Navigate previous / next screenshot' },
    { key: 'Ctrl + Z', action: 'Undo last annotation edit' },
    { key: 'Ctrl + Y / Ctrl + Shift + Z', action: 'Redo previously undone action' },
    { key: 'Delete / Backspace', action: 'Delete currently selected annotation' },
    { key: 'Middle Mouse Drag / Space + Drag', action: 'Pan workspace canvas' },
    { key: 'Click + Drag Handles', action: 'Resize highlight boxes & callout positions' },
    { key: 'Target Anchor Drag', action: 'Reposition callout line connector anchor' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-white">
              Keyboard & Mouse Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcutList.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e1e1e]/60 border border-white/5 text-xs">
              <span className="text-slate-300 font-medium">{item.action}</span>
              <kbd className="px-2 py-1 rounded bg-black/40 border border-white/10 font-mono text-[10px] text-indigo-300 font-semibold shadow">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
