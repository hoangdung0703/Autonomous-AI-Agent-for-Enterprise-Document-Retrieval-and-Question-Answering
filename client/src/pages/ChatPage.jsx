import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';

export default function ChatPage() {
  const { messages, loading, error, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-full bg-background-primary overflow-hidden relative">
      <ChatWindow messages={messages} loading={loading} />
      
      <div className="shrink-0 p-4 bg-gradient-to-t from-background-primary via-background-primary to-transparent z-10">
        {error && (
          <div className="max-w-4xl mx-auto mb-3 px-4 py-2 bg-status-failed-bg border border-status-failed/20 rounded-lg text-status-failed text-sm text-center">
            {error}
          </div>
        )}
        <ChatInput onSend={sendMessage} disabled={loading} />
        <div className="text-center mt-2">
          <span className="text-[10px] text-text-muted">DocMind AI can make mistakes. Consider verifying important information.</span>
        </div>
      </div>
    </div>
  );
}
