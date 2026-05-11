import { FileText } from 'lucide-react';

export default function ConversationHeader({ conversation }) {
  if (!conversation) return null;

  return (
    <div className="shrink-0 px-6 py-3 border-b border-border-subtle bg-background-secondary">
      <h2 className="text-sm font-semibold text-text-primary truncate mb-2">
        {conversation.title}
      </h2>
      {conversation.documentIds && conversation.documentIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {conversation.documentIds.map((doc) => (
            <span
              key={doc._id}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-text-secondary bg-background-elevated border border-border-subtle rounded-full px-2 py-0.5 max-w-[160px]"
              title={doc.originalName}
            >
              <FileText size={10} className="shrink-0" />
              <span className="truncate">{doc.originalName}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
