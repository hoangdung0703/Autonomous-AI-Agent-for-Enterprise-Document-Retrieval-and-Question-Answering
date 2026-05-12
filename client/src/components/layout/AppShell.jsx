import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background-primary overflow-hidden">
      {/* Mobile header — only visible on small screens */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-background-secondary shrink-0">
        <span className="text-sm font-semibold text-text-primary">DocMind</span>
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Overlay — mobile only */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />
      </main>
    </div>
  );
}
