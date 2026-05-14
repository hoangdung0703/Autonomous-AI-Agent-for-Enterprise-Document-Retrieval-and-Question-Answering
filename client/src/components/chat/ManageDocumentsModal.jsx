import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

export default function ManageDocumentsModal({ conversation, onUpdate, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (conversation?.documentIds) {
      setSelectedIds(conversation.documentIds.map((doc) => doc._id));
    }
  }, [conversation]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data } = await api.get('/documents');
        const docs = Array.isArray(data) ? data : data.documents;
        setDocuments(docs.filter((doc) => doc.status === 'ready'));
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

  const handleSubmit = async () => {
    setError('');

    if (selectedIds.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.patch(`/conversations/${conversation._id}/documents`, {
        documentIds: selectedIds
      });
      const updatedConversation = data.conversation || data;
      onUpdate(updatedConversation);
      addToast('Documents updated', 'success');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update documents');
      setIsSubmitting(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg bg-background-secondary border border-border-subtle rounded-xl shadow-xl animate-fade-in mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">Manage Documents</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-hover rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
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
                      <p className="text-xs text-text-muted">{doc.chunkCount ?? 0} chunks</p>
                    </div>
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

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={loadingDocs || isSubmitting}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
