import { useState } from 'react';
import { Trash2, FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import SkeletonRow from '../ui/SkeletonRow';
import Button from '../ui/Button';

export default function DocumentList({ documents, loading, onDelete, onReprocess }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleConfirmDelete = async (id) => {
    await onDelete(id);
    setDeleteConfirm(null);
  };
  if (loading) {
    return (
      <div className="bg-background-secondary rounded-xl border border-border-subtle p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-text-primary mb-6">Uploaded Documents</h3>
        <div className="space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-background-elevated rounded-lg">
              <SkeletonRow width="w-8" height="h-8" />
              <div className="flex-1 space-y-2">
                <SkeletonRow width="w-3/4" height="h-3" />
                <SkeletonRow width="w-1/2" height="h-3" />
              </div>
              <SkeletonRow width="w-16" height="h-6" />
              <SkeletonRow width="w-8" height="h-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary rounded-xl border border-border-subtle flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 border-b border-border-subtle flex justify-between items-center shrink-0">
        <h3 className="text-lg font-semibold text-text-primary">Uploaded Documents</h3>
        <span className="bg-background-elevated text-text-secondary text-xs px-2.5 py-1 rounded-full border border-border-subtle">
          {documents.length} Total
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="text-text-muted mb-4 opacity-40" />
            <p className="text-sm text-text-secondary font-medium">No documents uploaded yet</p>
            <p className="text-xs text-text-muted mt-1">Upload a PDF, DOCX, or XLSX to get started</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-background-elevated border-b border-border-subtle text-xs uppercase tracking-wider text-text-secondary">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-center">Chunks</th>
                <th className="px-6 py-4 font-medium">Uploaded At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-background-hover transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-text-muted shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-mono text-text-primary truncate max-w-[200px]" title={doc.originalName}>
                          {doc.originalName}
                        </span>
                        <span className="text-xs text-text-muted">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-center text-text-secondary">
                    {doc.chunkCount}
                  </td>
                  <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(doc.createdAt), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {doc.status === 'failed' && (
                        <button
                          onClick={() => onReprocess(doc._id)}
                          className="p-2 text-text-muted hover:text-accent transition-colors rounded"
                          title="Re-process document"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(doc._id)}
                        className="p-2 text-text-muted hover:text-status-failed hover:bg-status-failed-bg rounded transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background-elevated border border-border-subtle rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-text-primary font-semibold mb-2">Delete Document</h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to delete this document? This will also remove all its embedded vectors and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleConfirmDelete(deleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
