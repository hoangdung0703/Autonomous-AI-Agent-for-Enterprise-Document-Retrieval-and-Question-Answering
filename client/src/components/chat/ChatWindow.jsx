import { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ messages, loading, conversationId }) {
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  useEffect(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, userScrolledUp]);

  useEffect(() => {
    setUserScrolledUp(false);
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [conversationId]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setUserScrolledUp(!isNearBottom);
  };

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
    <>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 lg:px-8 py-6"
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {messages.map((msg, index) => (
            <MessageBubble key={msg._id || index} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} className="h-px w-full" />
        </div>
      </div>
      {userScrolledUp && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUserScrolledUp(false);
          }}
          className="absolute bottom-24 right-6 lg:right-12 z-50 bg-accent hover:bg-accent-hover text-white rounded-full p-2 shadow-lg transition-all"
        >
          <ChevronDown size={16} />
        </button>
      )}
    </>
  );
}
