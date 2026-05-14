import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useConversation(conversationId) {
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/conversations/${conversationId}`);
      setConversation(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    let cancelled = false;

    const fetchConversation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/conversations/${conversationId}`);
        if (!cancelled) setConversation(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load conversation');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchConversation();
    return () => { cancelled = true; };
  }, [conversationId]);

  const sendMessage = useCallback(async (question) => {
    if (!conversationId || !question.trim()) return;

    // Optimistic update — add user message immediately
    const userMessage = { role: 'user', content: question, createdAt: new Date().toISOString() };
    setConversation((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), userMessage],
    }));

    setIsSending(true);
    setError(null);

    try {
      const { data } = await api.post(`/conversations/${conversationId}/query`, { question });

      const assistantMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        createdAt: new Date().toISOString(),
      };

      setConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), assistantMessage],
      }));
    } catch (err) {
      // Roll back the optimistic user message on failure
      setConversation((prev) => ({
        ...prev,
        messages: (prev?.messages || []).filter((m) => m !== userMessage),
      }));
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [conversationId]);

  return { conversation, isLoading, isSending, error, sendMessage, refetch };
}
