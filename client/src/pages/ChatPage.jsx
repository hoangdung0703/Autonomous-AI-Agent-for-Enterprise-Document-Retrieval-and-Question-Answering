import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useConversation } from '../hooks/useConversation';
import ConversationHeader from '../components/chat/ConversationHeader';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';

export default function ChatPage() {
  const { id: conversationId } = useParams();
  const { conversation, isLoading, isSending, error, sendMessage } = useConversation(conversationId);

  // Empty state — no conversation selected
  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center mb-6">
          <MessageSquare size={28} className="text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Archon</h2>
        <p className="text-sm text-text-secondary max-w-sm">
          Select a conversation from the sidebar or create a new one to start querying your documents.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-primary overflow-hidden relative">
      {/* Conversation title + document chips */}
      <ConversationHeader conversation={conversation} />

      {/* Messages */}
      <ChatWindow messages={conversation?.messages || []} loading={isSending} conversationId={conversationId} />

      {/* Input area */}
      <div className="shrink-0 p-4 bg-gradient-to-t from-background-primary via-background-primary to-transparent z-10">
        {error && (
          <div className="max-w-4xl mx-auto mb-3 px-4 py-2 bg-status-failed-bg border border-status-failed/20 rounded-lg text-status-failed text-sm text-center">
            {error}
          </div>
        )}
        <ChatInput onSend={sendMessage} disabled={isSending} />
        <div className="text-center mt-2">
          <span className="text-[10px] text-text-muted">Archon answers only from selected documents.</span>
        </div>
      </div>
    </div>
  );
}
