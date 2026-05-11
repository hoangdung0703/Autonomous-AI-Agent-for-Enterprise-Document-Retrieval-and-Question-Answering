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
        <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        <SourceCitations sources={message.sources} />
      </div>
    </div>
  );
}
