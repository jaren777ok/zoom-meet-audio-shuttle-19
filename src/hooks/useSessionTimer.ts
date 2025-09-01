import { useState, useEffect, useCallback, useRef } from 'react';

export interface SessionDuration {
  startTime: number;
  endTime: number | null;
  durationMs: number;
  durationMinutes: number;
  isRunning: boolean;
}

export const useSessionTimer = () => {
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>({
    startTime: 0,
    endTime: null,
    durationMs: 0,
    durationMinutes: 0,
    isRunning: false,
  });

  const intervalRef = useRef<NodeJS.Timeout>();

  // Start the session timer
  const startTimer = useCallback(() => {
    const now = Date.now();
    
    setSessionDuration({
      startTime: now,
      endTime: null,
      durationMs: 0,
      durationMinutes: 0,
      isRunning: true,
    });

    // Update timer every second
    intervalRef.current = setInterval(() => {
      setSessionDuration(prev => {
        if (!prev.isRunning) return prev;
        
        const currentMs = Date.now() - prev.startTime;
        const currentMinutes = Math.round(currentMs / (1000 * 60) * 100) / 100;
        
        return {
          ...prev,
          durationMs: currentMs,
          durationMinutes: currentMinutes,
        };
      });
    }, 1000);
  }, []);

  // Stop the session timer
  const stopTimer = useCallback(() => {
    const now = Date.now();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setSessionDuration(prev => {
      const finalMs = now - prev.startTime;
      const finalMinutes = Math.round(finalMs / (1000 * 60) * 100) / 100;
      
      return {
        ...prev,
        endTime: now,
        durationMs: finalMs,
        durationMinutes: finalMinutes,
        isRunning: false,
      };
    });
  }, []);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setSessionDuration({
      startTime: 0,
      endTime: null,
      durationMs: 0,
      durationMinutes: 0,
      isRunning: false,
    });
  }, []);

  // Format duration for display
  const formatDuration = useCallback((durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Get formatted current duration
  const getFormattedDuration = useCallback((): string => {
    return formatDuration(sessionDuration.durationMs);
  }, [sessionDuration.durationMs, formatDuration]);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    return {
      ...sessionDuration,
      formattedDuration: formatDuration(sessionDuration.durationMs),
      durationHours: Math.round(sessionDuration.durationMs / (1000 * 60 * 60) * 100) / 100,
    };
  }, [sessionDuration, formatDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    sessionDuration,
    startTimer,
    stopTimer,
    resetTimer,
    formatDuration,
    getFormattedDuration,
    getSessionSummary,
  };
};