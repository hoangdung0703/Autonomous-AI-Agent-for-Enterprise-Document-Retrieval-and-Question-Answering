import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="relative flex items-end gap-2 w-full max-w-4xl mx-auto">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your documents..."
        disabled={disabled}
        className={twMerge(
          "w-full bg-background-elevated border border-border-subtle rounded-xl px-4 py-3",
          "text-sm text-text-primary resize-none placeholder:text-text-muted",
          "focus:border-border-default focus:outline-none transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "overflow-y-auto max-h-[120px] min-h-[44px]"
        )}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className={twMerge(
          "shrink-0 p-2.5 rounded-xl bg-accent text-white flex items-center justify-center transition-colors",
          "hover:bg-accent-hover disabled:opacity-50 disabled:bg-background-elevated disabled:text-text-muted",
          "mb-0.5"
        )}
      >
        <Send size={18} className={text.trim() && !disabled ? "fill-white" : ""} />
      </button>
    </div>
  );
}
