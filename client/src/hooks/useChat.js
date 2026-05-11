import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'docmind_chat_history';

export function useChat() {
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idCounter = useRef(
    messages.length > 0 ? Math.max(...messages.map((m) => m.id)) + 1 : 0
  );

  // Persist messages to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage quota exceeded — fail silently
    }
  }, [messages]);

  // Listen for sidebar "New Chat" event
  useEffect(() => {
    const handler = () => clearChat();
    window.addEventListener('docmind:clearchat', handler);
    return () => window.removeEventListener('docmind:clearchat', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (question) => {
    if (!question.trim()) return;

    const userMessage = {
      id: idCounter.current++,
      role: 'user',
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/chat/query', { question });

      const assistantMessage = {
        id: idCounter.current++,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    idCounter.current = 0;
  };

  return { messages, loading, error, sendMessage, clearChat };
}
