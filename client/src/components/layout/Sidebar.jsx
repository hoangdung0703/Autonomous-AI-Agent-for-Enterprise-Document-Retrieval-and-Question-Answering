import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, LogOut, Plus, MessageSquare, MoreHorizontal, Pencil, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useConversations } from '../../hooks/useConversations';
import { useJoinRequests } from '../../hooks/useJoinRequests';
import NewConversationModal from '../chat/NewConversationModal';
import SkeletonRow from '../ui/SkeletonRow';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { organizationName } = useAuth();
  const navigate = useNavigate();
  const { id: activeConversationId } = useParams();
  const { conversations, loading, createConversation, deleteConversation, renameConversation } = useConversations();
  const { pendingCount, fetchPendingRequests } = useJoinRequests();

  const [showModal, setShowModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const renameInputRef = useRef(null);

  // Focus rename input when activated
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close ⋯ menu when clicking outside
  useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => setMenuOpenId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [menuOpenId]);

  // Admin polling for pending requests
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchPendingRequests(); // Initial fetch
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user, fetchPendingRequests]);

  const handleCreate = async (title, documentIds) => {
    await createConversation(title, documentIds);
    onClose();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setMenuOpenId(null);
    await deleteConversation(id);
    // If deleting the active conversation, navigate to empty state
    if (id === activeConversationId) {
      navigate('/');
    }
  };

  const startRename = (e, conv) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setRenamingId(conv._id);
    setRenameValue(conv.title);
  };

  const commitRename = async (id) => {
    if (renameValue.trim()) {
      await renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleRenameKeyDown = (e, id) => {
    if (e.key === 'Enter') commitRename(id);
    if (e.key === 'Escape') setRenamingId(null);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-60 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col h-full`}
        style={{
          backgroundColor: 'rgba(15,15,20,0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 text-text-muted hover:text-text-primary"
        >
          <X size={18} />
        </button>

        {/* Logo + Org name */}
        <div className="h-14 flex items-center px-4 shrink-0 border-b border-border-subtle">
          <div className="flex flex-col min-w-0 -ml-3">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Archon" className="w-7 h-7" />
              <span className="text-sm font-semibold text-text-primary">Archon</span>
            </Link>
            {organizationName && (
              <span className="text-[10px] text-text-muted pl-12 truncate -mt-1 pb-1">{organizationName}</span>
            )}
          </div>
        </div>

        {/* New Conversation button */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-text-primary bg-background-elevated hover:bg-background-hover border border-border-subtle rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Conversation
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            Conversations
          </p>

          {loading ? (
            <div className="px-2 space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <SkeletonRow width="w-full" height="h-4" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare size={32} className="text-text-muted mb-3 opacity-50" />
              <p className="text-sm text-text-secondary font-medium">No conversations yet</p>
              <p className="text-xs text-text-muted mt-1">Click "New Conversation" to get started</p>
            </div>
          ) : (
            <>
              {/* Search box */}
              <div className="px-2 mb-2">
                <div className="flex items-center gap-2 bg-background-elevated border border-border-subtle rounded-lg px-3 py-1.5">
                  <Search size={12} className="text-text-muted flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X size={12} className="text-text-muted hover:text-text-primary" />
                    </button>
                  )}
                </div>
              </div>
              {filteredConversations.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <Search size={24} className="text-text-muted mb-2 opacity-50" />
                  <p className="text-xs text-text-muted">No conversations match "{searchQuery}"</p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {filteredConversations.map((conv) => {
                    const isActive = conv._id === activeConversationId;
                    return (
                      <li key={conv._id} className="relative group">
                        {renamingId === conv._id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(conv._id)}
                            onKeyDown={(e) => handleRenameKeyDown(e, conv._id)}
                            maxLength={100}
                            className="w-full px-3 py-2 text-sm bg-background-elevated border border-accent rounded-md text-text-primary outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => { navigate(`/conversations/${conv._id}`); onClose(); }}
                            className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                              isActive
                                ? 'bg-accent-subtle text-accent border-l-2 border-accent pl-[10px]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                            }`}
                          >
                            <span className="truncate flex-1">{conv.title}</span>

                            {/* ⋯ menu trigger */}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === conv._id ? null : conv._id);
                              }}
                              className={`shrink-0 p-0.5 rounded hover:bg-background-hover ml-1 transition-opacity ${
                                isActive || menuOpenId === conv._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <MoreHorizontal size={14} />
                            </span>
                          </button>
                        )}

                        {/* Dropdown menu */}
                        {menuOpenId === conv._id && (
                          <div className="absolute right-2 top-full mt-0.5 z-40 bg-background-elevated border border-border-subtle rounded-lg shadow-lg overflow-hidden min-w-[130px]">
                            <button
                              onClick={(e) => startRename(e, conv)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-primary hover:bg-background-hover transition-colors"
                            >
                              <Pencil size={12} />
                              Rename
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, conv._id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-status-failed hover:bg-status-failed-bg transition-colors"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-border-subtle">
          {/* Admin: Documents link */}
          {user?.role === 'admin' && (
            <div className="px-3 py-2">
              <NavLink
                to="/dashboard"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-accent-subtle text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                  }`
                }
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={15} />
                    Dashboard
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-status-failed text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </div>
              </NavLink>
            </div>
          )}

          {/* User info + logout */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-text-primary truncate">{user?.name}</span>
              <span className="text-[10px] text-text-muted truncate">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="shrink-0 p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-md transition-colors ml-2"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {showModal && (
        <NewConversationModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}
