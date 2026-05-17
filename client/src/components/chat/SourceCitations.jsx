import { FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function SourceCitations({ sources }) {
  const [showSources, setShowSources] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const cleanFileName = (fileName) => {
    return fileName
      .replace(/^\d+-\d+-/, '')
      .replace(/\.[^/.]+$/, '');
  };

  if (!sources?.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowSources(prev => !prev)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ChevronDown size={12} className={showSources ? 'rotate-180 transition-transform' : 'transition-transform'} />
        View {sources.length} source passage{sources.length > 1 ? 's' : ''}
      </button>

      {showSources && (
        <div className="mt-2 space-y-1">
          {sources.map((source, i) => (
            <div key={i} className="border border-border-subtle rounded-lg overflow-hidden">
              {/* Header row — always visible */}
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-background-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={12} className="text-text-muted flex-shrink-0" />
                  <span className="text-xs text-text-muted truncate">
                    {cleanFileName(source.fileName)}
                  </span>
                  <span className="text-[10px] text-text-muted flex-shrink-0">~p.{source.chunkIndex}</span>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-text-muted flex-shrink-0 transition-transform ${expandedIndex === i ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Excerpt — shown when expanded */}
              {expandedIndex === i && source.excerpt && (
                <div
                  style={{
                    borderLeft: '2px solid rgba(99,102,241,0.5)',
                    backgroundColor: 'rgba(99,102,241,0.05)',
                    padding: '10px 14px',
                    margin: '4px 0',
                    borderRadius: '0 6px 6px 0'
                  }}
                >
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {source.excerpt}
                  </p>
                </div>
              )}

              {/* No excerpt available */}
              {expandedIndex === i && !source.excerpt && (
                <div className="px-3 py-2 border-t border-border-subtle bg-background-primary">
                  <p className="text-xs text-text-muted italic">Excerpt not available</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
