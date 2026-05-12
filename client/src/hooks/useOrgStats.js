import { useState, useEffect } from 'react';
import api from '../services/api';

const useOrgStats = () => {
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/organizations/me')
      .then(res => setMemberCount(res.data.memberCount))
      .catch(() => setMemberCount(0))
      .finally(() => setLoading(false));
  }, []);

  return { memberCount, loading };
};

export default useOrgStats;
