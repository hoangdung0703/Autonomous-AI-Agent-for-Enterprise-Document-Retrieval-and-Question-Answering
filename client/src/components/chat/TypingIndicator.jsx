export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 max-w-[80%] animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-accent shrink-0 flex items-center justify-center mr-3">
        <span className="text-[10px] text-white font-bold">D</span>
      </div>
      <div className="flex gap-1.5 items-center h-6">
        <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
