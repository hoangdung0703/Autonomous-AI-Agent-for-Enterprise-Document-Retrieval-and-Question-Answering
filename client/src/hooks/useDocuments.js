import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load documents');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling logic
  useEffect(() => {
    fetchDocuments();

    intervalRef.current = setInterval(async () => {
      const docs = await fetchDocuments();
      // Stop polling if no documents are in processing state
      const hasProcessing = docs.some((doc) => doc.status === 'processing');
      if (!hasProcessing && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDocuments]);

  const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Add processing doc to state immediately
      setDocuments((prev) => [data.document, ...prev]);
      // Restart polling
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchDocuments, 3000);
      }
      return data;
    } catch (err) {
      throw err.response?.data?.message || err.response?.data?.error?.message || 'Upload failed';
    }
  };

  const deleteDocument = async (id) => {
    // Optimistic delete
    const prevDocs = [...documents];
    setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    try {
      await api.delete(`/documents/${id}`);
    } catch (err) {
      // Restore on failure
      setDocuments(prevDocs);
      throw err.response?.data?.message || 'Failed to delete document';
    }
  };

  return { documents, loading, error, uploadDocument, deleteDocument, fetchDocuments };
}
