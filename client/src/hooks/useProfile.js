import { useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users/me');
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async ({ name, avatar }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch('/users/me', { name, avatar });
      localStorage.setItem('archon_token', data.token);
      const decoded = jwtDecode(data.token);
      setProfile(prev => ({ ...prev, name: decoded.name }));
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update profile';
      setError(msg);
      throw msg;
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile, updateProfile };
}
