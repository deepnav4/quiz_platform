import { useState, useEffect } from 'react';
import { getSession } from '../api/session.js';

export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getSession(sessionId)
      .then((data) => setSession(data.session))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  function refetch() {
    setLoading(true);
    getSession(sessionId)
      .then((data) => setSession(data.session))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  return { session, setSession, loading, error, refetch };
}
