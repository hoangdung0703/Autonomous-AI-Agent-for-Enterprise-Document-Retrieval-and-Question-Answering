import ReactMarkdown from 'react-markdown';
import SourceCitations from './SourceCitations';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div
        className="ml-auto max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-sm px-4 py-3 animate-fade-in text-sm text-white whitespace-pre-wrap"
        style={{ backgroundColor: 'rgba(99,102,241,0.30)', border: '1px solid rgba(99,102,241,0.40)' }}
      >
        {message.content}
      </div>
    );
  }

  return (
    <div
      className="flex w-full max-w-[80%] animate-fade-in group"
      style={{ backgroundColor: 'rgba(20,20,28,0.60)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}
    >
      <img src="/logo.png" className="w-6 h-6 rounded-full shrink-0 mr-3 mt-1" />
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
