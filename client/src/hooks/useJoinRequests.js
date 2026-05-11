import { useState, useCallback } from 'react';
import api from '../services/api';

export function useJoinRequests() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/join-requests');
      setPendingRequests(data);
      setPendingCount(data.length);
    } catch (error) {
      console.error('Failed to fetch join requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRequest = async (requestId) => {
    try {
      await api.patch(`/join-requests/${requestId}/approve`);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setPendingCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      throw error.response?.data?.message || 'Failed to approve request';
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.patch(`/join-requests/${requestId}/reject`);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setPendingCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      throw error.response?.data?.message || 'Failed to reject request';
    }
  };

  return {
    pendingRequests,
    loading,
    pendingCount,
    fetchPendingRequests,
    approveRequest,
    rejectRequest,
  };
}
