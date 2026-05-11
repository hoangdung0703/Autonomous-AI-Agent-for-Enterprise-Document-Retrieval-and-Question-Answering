import ReactMarkdown from 'react-markdown';
import SourceCitations from './SourceCitations';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="ml-auto max-w-[70%] bg-accent-subtle border border-accent/20 rounded-2xl rounded-tr-sm px-4 py-3 animate-fade-in text-sm text-text-primary whitespace-pre-wrap">
        {message.content}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[80%] animate-fade-in group">
      <div className="w-6 h-6 rounded-full bg-accent shrink-0 flex items-center justify-center mr-3 mt-1">
        <span className="text-[10px] text-white font-bold">D</span>
      </div>
      <div className="flex-1 min-w-0">
          <div className="chat-content text-sm text-text-primary leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc mb-2 space-y-1 pl-4">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal mb-2 space-y-1 pl-4">{children}</ol>,
                li: ({children}) => (
                  <li className="text-text-primary pl-1">
                    {children}
                  </li>
                ),
                strong: ({children}) => <strong className="font-semibold text-text-primary">{children}</strong>,
                h1: ({children}) => <h1 className="text-base font-semibold mb-2 mt-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-sm font-semibold mb-1 mt-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-medium mb-1 mt-2">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        <SourceCitations sources={message.sources} />
      </div>
    </div>
  );
}
