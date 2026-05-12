import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/conversations?page=1&limit=20');
      setConversations(data.conversations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (title, documentIds) => {
    try {
      const { data } = await api.post('/conversations', { title, documentIds });
      setConversations((prev) => [data, ...prev]);
      addToast('Conversation created', 'success');
      navigate(`/conversations/${data._id}`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to create conversation';
      addToast(msg, 'error');
      throw err;
    }
  }, [navigate, addToast]);

  const deleteConversation = useCallback(async (id) => {
    await api.delete(`/conversations/${id}`);
    setConversations((prev) => prev.filter((c) => c._id !== id));
    addToast('Conversation deleted', 'success');
  }, [addToast]);

  const renameConversation = useCallback(async (id, newTitle) => {
    const { data } = await api.patch(`/conversations/${id}/title`, { title: newTitle });
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, title: data.title } : c))
    );
    addToast('Conversation renamed', 'success');
    return data;
  }, [addToast]);

  return {
    conversations,
    pagination,
    loading,
    error,
    createConversation,
    deleteConversation,
    renameConversation,
    refetch: fetchConversations,
  };
}
