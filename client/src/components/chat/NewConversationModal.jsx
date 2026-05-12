import { useState, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';

const generateTitle = (selectedDocIds, documents) => {
  const selectedDocs = documents.filter(d => selectedDocIds.includes(d._id));
  if (selectedDocs.length === 0) return 'New Conversation';
  if (selectedDocs.length === 1) {
    // Remove file extension and truncate
    const name = selectedDocs[0].originalName.replace(/\.[^/.]+$/, '');
    return name.length > 50 ? name.slice(0, 50) + '...' : name;
  }
  if (selectedDocs.length === 2) {
    const names = selectedDocs.map(d => d.originalName.replace(/\.[^/.]+$/, ''));
    return `${names[0].slice(0, 25)} + ${names[1].slice(0, 25)}`;
  }
  // 3+ documents
  const firstName = selectedDocs[0].originalName.replace(/\.[^/.]+$/, '').slice(0, 30);
  return `${firstName} + ${selectedDocs.length - 1} more`;
};

export default function NewConversationModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hoveredDoc, setHoveredDoc] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data } = await api.get('/documents');
        // Support both paginated { documents } and flat array responses
        const docs = Array.isArray(data) ? data : data.documents;
        setDocuments(docs.filter((d) => d.status === 'ready'));
      } catch {
        setError('Failed to load documents');
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  const toggleDoc = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    setError('');

    if (selectedIds.length === 0) {
      setError('Please select at least one document');
      return;
    }
    if (title.length > 100) {
      setError('Title cannot exceed 100 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTitle = title.trim() || generateTitle(selectedIds, documents);
      await onCreate(finalTitle, selectedIds);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create conversation');
      setIsSubmitting(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg bg-background-secondary border border-border-subtle rounded-xl shadow-xl animate-fade-in mx-4 relative overflow-visible"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <Input
            label="Title (optional)"
            placeholder="Leave blank to auto-generate from documents"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />

          <div>
            <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
              Select Documents <span className="text-status-failed">*</span>
            </p>

            {loadingDocs ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <Loader2 size={14} className="animate-spin" />
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-text-muted py-4">
                No ready documents found. Upload and process a document first.
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-border-subtle bg-background-elevated p-1">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-hover cursor-pointer"
                    onMouseEnter={() => setHoveredDoc(doc)}
                    onMouseLeave={() => setHoveredDoc(null)}
                    onClick={() => !isSubmitting && toggleDoc(doc._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc._id)}
                      onChange={() => toggleDoc(doc._id)}
                      disabled={isSubmitting}
                      className="w-4 h-4 accent-accent rounded flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{doc.originalName}</p>
                      <p className="text-xs text-text-muted">{formatFileSize(doc.size)} · {doc.chunkCount ?? 0} chunks</p>
                    </div>
                    <Info size={14} className="text-text-muted flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted mt-1">{selectedIds.length} selected (max 10)</p>
          </div>

          {error && (
            <p className="text-sm text-status-failed bg-status-failed-bg border border-status-failed/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={loadingDocs || isSubmitting}
          >
            Create Conversation
          </Button>
        </div>

        {/* Document info popover */}
        {hoveredDoc && (
          <div className="absolute left-full ml-3 top-0 w-64 bg-background-elevated border border-border-subtle rounded-xl p-4 shadow-lg z-10">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Document Info</p>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-text-muted">File name</p>
                <p className="text-xs text-text-primary font-mono break-all">{hoveredDoc.originalName}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted">Size</p>
                <p className="text-xs text-text-primary">{formatFileSize(hoveredDoc.size)}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted">Chunks embedded</p>
                <p className="text-xs text-text-primary">{hoveredDoc.chunkCount ?? 0} chunks</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted">Uploaded</p>
                <p className="text-xs text-text-primary">{new Date(hoveredDoc.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted">Uploaded by</p>
                <p className="text-xs text-text-primary">{hoveredDoc.uploadedBy?.name || 'Admin'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
