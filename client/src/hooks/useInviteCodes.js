import { useState, useCallback } from 'react';
import api from '../services/api';

export function useInviteCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/invite-codes');
      setCodes(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invite codes');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCode = async (expiryHours, maxUsage) => {
    try {
      const { data } = await api.post('/invite-codes', { expiryHours, maxUsage });
      // Prepend the new code, compute its local isValid/isExpired/isExhausted
      const newCode = {
        ...data,
        isExpired: false,
        isExhausted: false,
        isValid: true,
        createdBy: { name: 'You' } // Optimistic UI for createdBy
      };
      setCodes(prev => [newCode, ...prev]);
      return newCode;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to generate code';
    }
  };

  const deactivateCode = async (id) => {
    try {
      await api.patch(`/invite-codes/${id}/deactivate`);
      setCodes(prev => prev.map(c => 
        c._id === id 
          ? { ...c, isActive: false, isValid: false } 
          : c
      ));
    } catch (err) {
      throw err.response?.data?.message || 'Failed to deactivate code';
    }
  };

  const deleteCode = async (id) => {
    try {
      await api.delete(`/invite-codes/${id}`);
      setCodes(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      throw err.response?.data?.message || 'Failed to delete code';
    }
  };

  return {
    codes,
    loading,
    error,
    fetchCodes,
    generateCode,
    deactivateCode,
    deleteCode
  };
}
