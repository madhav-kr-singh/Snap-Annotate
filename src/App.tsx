import React, { useState, useCallback, useRef } from 'react';
import { AppProvider } from './store/useAppStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { InspectorToolbar } from './components/InspectorToolbar';
import { ShortcutsModal } from './components/ShortcutsModal';

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 320; // w-80

export const AppContent: React.FC = () => {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isResizing = useRef(false);

  const toggleLeftSidebar = () => setIsLeftSidebarOpen((prev) => !prev);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121212] text-slate-100">
      {/* Header Navbar */}
      <Header
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={toggleLeftSidebar}
      />

      {/* Main Studio Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Image Thumbnails */}
        {isLeftSidebarOpen && (
          <>
            <Sidebar width={sidebarWidth} />

            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="resize-handle group flex items-center justify-center"
              title="Drag to resize sidebar"
            >
              <div className="w-0.5 h-10 rounded-full transition-all duration-150 group-hover:h-14"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              />
            </div>
          </>
        )}

        {/* Center Interactive Studio Canvas Workspace */}
        <CanvasWorkspace
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={toggleLeftSidebar}
        />

        {/* Right Inspector & Grouping Toolbar */}
        <InspectorToolbar />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
