import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent-subtle flex items-center justify-center mb-4 border border-accent/20">
          <span className="text-xl text-accent font-bold">D</span>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome to DocMind</h2>
        <p className="text-sm text-text-secondary max-w-md">
          Ask questions about your uploaded enterprise documents. I will retrieve relevant context and provide accurate, grounded answers.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </div>
  );
}
