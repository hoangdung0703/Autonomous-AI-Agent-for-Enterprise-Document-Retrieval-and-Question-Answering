import { NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, LogOut, SquarePen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
      isActive
        ? 'bg-accent-subtle text-accent border-l-2 border-accent'
        : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-60 bg-background-secondary border-r border-border-subtle flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo area */}
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-lg">
            <div className="w-5 h-5 bg-accent rounded-sm flex items-center justify-center">
              <span className="text-white text-xs">D</span>
            </div>
            DocMind
          </div>
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent('docmind:clearchat')); onClose(); }}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-md transition-colors"
            title="New Chat"
          >
            <SquarePen size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <NavLink to="/" onClick={onClose} className={navClass}>
            <MessageSquare size={16} />
            Chat
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/dashboard" onClick={onClose} className={navClass}>
              <LayoutDashboard size={16} />
              Documents
            </NavLink>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-text-primary truncate">{user?.name}</span>
              <span className="text-xs text-text-muted truncate">{user?.email}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
