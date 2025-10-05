import { useState, useEffect, useRef } from 'react';
import { checkRouteAudioStatus } from '../api/routes';

/**
 * Hook for polling audio generation status
 * @param {string} routeId - Route ID to poll
 * @param {boolean} enabled - Whether polling is enabled
 * @param {number} interval - Polling interval in ms (default: 5000)
 * @returns {Object} Polling state
 */
export const useAudioPolling = (routeId, enabled = false, interval = 5000) => {
  const [status, setStatus] = useState({
    ready: false,
    partial: false,
    loading: enabled,
    error: null,
  });
  
  const timeoutRef = useRef(null);
  const attemptsRef = useRef(0);
  const maxAttempts = 60; // 5 minutes with 5 second intervals

  useEffect(() => {
    if (!enabled || !routeId) {
      return;
    }

    const poll = async () => {
      if (attemptsRef.current >= maxAttempts) {
        setStatus({
          ready: false,
          partial: false,
          loading: false,
          error: 'Превышено время ожидания генерации аудио',
        });
        return;
      }

      try {
        const result = await checkRouteAudioStatus(routeId);
        
        if (result.ready) {
          setStatus({
            ready: true,
            partial: false,
            loading: false,
            error: null,
          });
        } else {
          attemptsRef.current += 1;
          setStatus({
            ready: false,
            partial: result.partial,
            loading: true,
            error: null,
          });
          
          // Schedule next poll
          timeoutRef.current = setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('Error polling audio status:', error);
        attemptsRef.current += 1;
        
        // Continue polling even on error
        timeoutRef.current = setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [routeId, enabled, interval]);

  return status;
};
