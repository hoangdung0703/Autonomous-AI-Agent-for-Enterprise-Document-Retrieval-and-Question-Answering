import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function SourceCitations({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Show {sources.length} source{sources.length > 1 ? 's' : ''}
      </button>
      
      {expanded && (
        <div className="flex flex-wrap gap-2 mt-2">
          {sources.map((source, idx) => (
            <div 
              key={`${source.fileName}-${source.chunkIndex}-${idx}`}
              className="font-mono text-[10px] text-text-muted bg-background-elevated border border-border-subtle rounded px-2 py-1 max-w-[200px] truncate"
              title={`${source.fileName} (Chunk ${source.chunkIndex})`}
            >
              {source.fileName} ({source.chunkIndex})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
