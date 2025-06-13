import {useCallback, useState} from 'react';


export default function useHttp() {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    async (url: string, method: string = 'GET', credentials: RequestCredentials | undefined = undefined,
                   body = null, headers = {}) => {
      setLoading(true);

      try {
        const response = await fetch(url, {
          method: method,
          credentials: credentials,
          body: body,
          headers: headers
        });
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setIsAuthenticated(false);
          }

          throw new Error(data.message || 'Something went wrong');
        } else {
          setIsAuthenticated(true);
        }

        setLoading(false);
        return data;
      } catch (e: any) {
        setLoading(false);
        setError(e.message);

        throw e;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {loading, request, error, clearError, isAuthenticated};
}
