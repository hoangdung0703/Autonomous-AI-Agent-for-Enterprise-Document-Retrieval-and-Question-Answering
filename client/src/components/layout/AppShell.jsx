import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{
      backgroundColor: '#0a0a0a',
      position: 'relative'
    }}>
      {/* Top-left glow */}
      <div style={{
        position: 'fixed', top: '-10%', left: '15%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
        filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 0
      }} />
      {/* Bottom-right glow */}
      <div style={{
        position: 'fixed', bottom: '-10%', right: '5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)',
        filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 0
      }} />
      {/* Starfield */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '120px 120px, 80px 80px',
        backgroundPosition: '0 0, 40px 40px',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }} className="flex flex-col md:flex-row h-full w-full">
        {/* Mobile header — only visible on small screens */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-background-secondary shrink-0">
          <span className="text-sm font-semibold text-text-primary">Archon</span>
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
    </div>
  );
}
