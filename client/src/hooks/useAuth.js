import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(() => localStorage.getItem('archon_avatar') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('archon_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Basic check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('archon_token');
          setUser(null);
        } else {
          setUser(decoded);
        }
      } catch (e) {
        localStorage.removeItem('archon_token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthUpdate = () => {
      console.log('[useAuth] auth-updated fired');
      console.log('[useAuth] archon_avatar in localStorage:', localStorage.getItem('archon_avatar') ? 'EXISTS' : 'NULL');
      console.log('[useAuth] setting avatar state to:', localStorage.getItem('archon_avatar') ? 'IMAGE' : 'NULL');
      const token = localStorage.getItem('archon_token');
      if (token) {
        setUser(jwtDecode(token));
      }
      setAvatar(localStorage.getItem('archon_avatar') || null);
    };

    window.addEventListener('auth-updated', handleAuthUpdate);
    return () => window.removeEventListener('auth-updated', handleAuthUpdate);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('archon_token', data.token);
      const decoded = jwtDecode(data.token);
      setUser(decoded);
      // Redirect to onboarding if user hasn't joined an org yet
      if (!decoded.organizationId) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('archon_token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Called after org create/join — store fresh token and update user state
  const updateToken = useCallback((newToken) => {
    localStorage.setItem('archon_token', newToken);
    const decoded = jwtDecode(newToken);
    setUser(decoded);
  }, []);

  return {
    user,
    avatar,
    loading,
    login,
    logout,
    updateToken,
    // Convenience accessors decoded from JWT
    organizationId: user?.organizationId || null,
    organizationName: user?.organizationName || null,
  };
}
