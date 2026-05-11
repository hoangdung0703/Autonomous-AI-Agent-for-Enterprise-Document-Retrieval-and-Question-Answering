import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background-primary overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile header to toggle sidebar */}
        <header className="lg:hidden h-14 border-b border-border-subtle flex items-center px-4 bg-background-secondary shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary"
          >
            <Menu size={20} />
          </button>
          <div className="ml-2 font-semibold text-text-primary">DocMind</div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
