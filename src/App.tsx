import React, { useState } from 'react';
import { AppProvider } from './store/useAppStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { InspectorToolbar } from './components/InspectorToolbar';
import { ShortcutsModal } from './components/ShortcutsModal';

export const AppContent: React.FC = () => {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  const toggleLeftSidebar = () => setIsLeftSidebarOpen((prev) => !prev);

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
        {isLeftSidebarOpen && <Sidebar />}

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
