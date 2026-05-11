import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/conversations');
      setConversations(data);
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
    const { data } = await api.post('/conversations', { title, documentIds });
    setConversations((prev) => [data, ...prev]);
    navigate(`/conversations/${data._id}`);
    return data;
  }, [navigate]);

  const deleteConversation = useCallback(async (id) => {
    await api.delete(`/conversations/${id}`);
    setConversations((prev) => prev.filter((c) => c._id !== id));
  }, []);

  const renameConversation = useCallback(async (id, newTitle) => {
    const { data } = await api.patch(`/conversations/${id}/title`, { title: newTitle });
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, title: data.title } : c))
    );
    return data;
  }, []);

  return {
    conversations,
    loading,
    error,
    createConversation,
    deleteConversation,
    renameConversation,
    refetch: fetchConversations,
  };
}
