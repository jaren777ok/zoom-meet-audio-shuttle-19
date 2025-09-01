import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkQuality {
  quality: number; // 1-10 scale
  networkType: string;
  speed: number; // Mbps
  latency: number; // ms
  timestamp: number;
}

export interface NetworkStability {
  measurements: NetworkQuality[];
  stabilityScore: number; // 0-10
  averageQuality: number;
}

export const useNetworkQuality = () => {
  const [currentQuality, setCurrentQuality] = useState<NetworkQuality | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [measurements, setMeasurements] = useState<NetworkQuality[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Get network connection info using Navigator API
  const getConnectionInfo = useCallback(() => {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }
    
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };
  }, []);

  // Perform speed test by downloading a small resource
  const performSpeedTest = useCallback(async (): Promise<{ speed: number; latency: number }> => {
    try {
      const startTime = performance.now();
      
      // Use a small image from a CDN for speed test
      const response = await fetch('https://via.placeholder.com/1x1.png?nocache=' + Math.random(), {
        method: 'GET',
        cache: 'no-cache',
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      if (response.ok) {
        const blob = await response.blob();
        const sizeBytes = blob.size;
        const durationSeconds = latency / 1000;
        const speedBps = sizeBytes / durationSeconds;
        const speedMbps = (speedBps * 8) / (1024 * 1024);
        
        return {
          speed: Math.max(speedMbps, 0.1), // Minimum 0.1 Mbps
          latency: Math.min(latency, 5000), // Cap at 5 seconds
        };
      }
    } catch (error) {
      console.warn('Speed test failed:', error);
    }
    
    // Fallback values
    return { speed: 1, latency: 1000 };
  }, []);

  // Calculate quality score based on multiple factors
  const calculateQuality = useCallback((networkType: string, speed: number, latency: number): number => {
    let qualityScore = 5; // Base score
    
    // Network type scoring
    const typeScores: { [key: string]: number } = {
      '4g': 8,
      '3g': 5,
      '2g': 2,
      'wifi': 9,
      'ethernet': 10,
      'unknown': 5,
    };
    
    const typeScore = typeScores[networkType.toLowerCase()] || 5;
    
    // Speed scoring (logarithmic scale)
    let speedScore = 5;
    if (speed >= 25) speedScore = 10;
    else if (speed >= 10) speedScore = 8;
    else if (speed >= 5) speedScore = 6;
    else if (speed >= 1) speedScore = 4;
    else speedScore = 2;
    
    // Latency scoring (inverse relationship)
    let latencyScore = 10;
    if (latency > 1000) latencyScore = 2;
    else if (latency > 500) latencyScore = 4;
    else if (latency > 200) latencyScore = 6;
    else if (latency > 100) latencyScore = 8;
    
    // Weighted average
    qualityScore = Math.round((typeScore * 0.3 + speedScore * 0.4 + latencyScore * 0.3));
    
    return Math.max(1, Math.min(10, qualityScore));
  }, []);

  // Measure network quality
  const measureQuality = useCallback(async (): Promise<NetworkQuality> => {
    const connectionInfo = getConnectionInfo();
    const { speed, latency } = await performSpeedTest();
    
    const quality = calculateQuality(connectionInfo.effectiveType, speed, latency);
    
    return {
      quality,
      networkType: connectionInfo.effectiveType,
      speed: Math.round(speed * 100) / 100,
      latency: Math.round(latency),
      timestamp: Date.now(),
    };
  }, [getConnectionInfo, performSpeedTest, calculateQuality]);

  // Start monitoring network quality
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Initial measurement
    const initialQuality = await measureQuality();
    setCurrentQuality(initialQuality);
    setMeasurements([initialQuality]);
    
    // Set up periodic monitoring (every 30 seconds)
    intervalRef.current = setInterval(async () => {
      try {
        const newQuality = await measureQuality();
        setCurrentQuality(newQuality);
        setMeasurements(prev => [...prev, newQuality].slice(-20)); // Keep last 20 measurements
      } catch (error) {
        console.error('Network quality measurement failed:', error);
      }
    }, 30000);
  }, [isMonitoring, measureQuality]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // Calculate network stability metrics
  const getNetworkStability = useCallback((): NetworkStability => {
    if (measurements.length === 0) {
      return {
        measurements: [],
        stabilityScore: 0,
        averageQuality: 0,
      };
    }
    
    const averageQuality = measurements.reduce((sum, m) => sum + m.quality, 0) / measurements.length;
    
    // Calculate stability score based on variance
    const variance = measurements.reduce((sum, m) => sum + Math.pow(m.quality - averageQuality, 2), 0) / measurements.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Stability score (lower variance = higher stability)
    const stabilityScore = Math.max(0, Math.min(10, 10 - (standardDeviation * 2)));
    
    return {
      measurements: [...measurements],
      stabilityScore: Math.round(stabilityScore * 100) / 100,
      averageQuality: Math.round(averageQuality * 100) / 100,
    };
  }, [measurements]);

  // Get quality label
  const getQualityLabel = useCallback((quality: number): string => {
    if (quality >= 8) return 'Excelente';
    if (quality >= 6) return 'Buena';
    if (quality >= 4) return 'Regular';
    if (quality >= 2) return 'Mala';
    return 'Muy Mala';
  }, []);

  // Get quality color
  const getQualityColor = useCallback((quality: number): string => {
    if (quality >= 8) return 'text-green-500';
    if (quality >= 6) return 'text-blue-500';
    if (quality >= 4) return 'text-yellow-500';
    if (quality >= 2) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentQuality,
    isMonitoring,
    measurements,
    startMonitoring,
    stopMonitoring,
    measureQuality,
    getNetworkStability,
    getQualityLabel,
    getQualityColor,
  };
};