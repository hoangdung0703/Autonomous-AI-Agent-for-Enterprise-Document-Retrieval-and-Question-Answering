import { Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import SkeletonRow from '../ui/SkeletonRow';

export default function DocumentList({ documents, loading, onDelete }) {
  if (loading) {
    return (
      <div className="bg-background-secondary rounded-xl border border-border-subtle p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-text-primary mb-6">Uploaded Documents</h3>
        <div className="flex-1">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
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
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-text-muted">
            <FileText size={48} strokeWidth={1} className="mb-4 opacity-50" />
            <p>No documents uploaded yet.</p>
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
                    <button
                      onClick={() => onDelete(doc._id)}
                      className="p-2 text-text-muted hover:text-status-failed hover:bg-status-failed-bg rounded transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
