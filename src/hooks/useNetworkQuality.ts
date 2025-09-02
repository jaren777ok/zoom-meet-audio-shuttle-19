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

  // Perform real speed test using multiple measurement methods
  const performSpeedTest = useCallback(async (): Promise<{ speed: number; latency: number }> => {
    const tests = [];
    
    // Test 1: Fast.com style speed test with larger payload
    try {
      const testUrls = [
        'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js', // ~88KB
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css', // ~160KB
        'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js' // ~71KB
      ];
      
      for (const url of testUrls) {
        const startTime = performance.now();
        const response = await Promise.race([
          fetch(url + '?t=' + Date.now(), { cache: 'no-cache' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
        ]) as Response;
        
        if (response.ok) {
          const blob = await response.blob();
          const endTime = performance.now();
          const duration = (endTime - startTime) / 1000; // seconds
          const speedMbps = (blob.size * 8) / (duration * 1024 * 1024);
          const latency = endTime - startTime;
          
          tests.push({ speed: speedMbps, latency });
        }
      }
    } catch (error) {
      console.warn('Primary speed test failed:', error);
    }

    // Test 2: Cloudflare speed test as backup
    try {
      const startTime = performance.now();
      const response = await Promise.race([
        fetch('https://speed.cloudflare.com/__down?bytes=100000', { cache: 'no-cache' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]) as Response;
      
      if (response.ok) {
        const blob = await response.blob();
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        const speedMbps = (blob.size * 8) / (duration * 1024 * 1024);
        const latency = endTime - startTime;
        
        tests.push({ speed: speedMbps, latency });
      }
    } catch (error) {
      console.warn('Cloudflare speed test failed:', error);
    }

    // Test 3: Ping test for latency accuracy
    try {
      const pingResults = await Promise.all([
        measurePing('https://1.1.1.1'),
        measurePing('https://8.8.8.8'),
        measurePing('https://google.com')
      ]);
      
      const avgLatency = pingResults.filter(p => p > 0).reduce((sum, p) => sum + p, 0) / pingResults.filter(p => p > 0).length;
      if (avgLatency && avgLatency < 5000) {
        tests.push({ speed: 0, latency: avgLatency });
      }
    } catch (error) {
      console.warn('Ping test failed:', error);
    }

    if (tests.length === 0) {
      return { speed: 1, latency: 1000 }; // Fallback
    }

    // Calculate weighted average (prioritize speed tests over ping-only)
    const speedTests = tests.filter(t => t.speed > 0);
    const avgSpeed = speedTests.length > 0 
      ? speedTests.reduce((sum, t) => sum + t.speed, 0) / speedTests.length 
      : 1;
    
    const avgLatency = tests.reduce((sum, t) => sum + t.latency, 0) / tests.length;
    
    return {
      speed: Math.max(0.1, Math.min(1000, avgSpeed)), // Between 0.1 and 1000 Mbps
      latency: Math.max(1, Math.min(5000, avgLatency)) // Between 1ms and 5000ms
    };
  }, []);

  // Measure ping to a specific endpoint
  const measurePing = async (url: string): Promise<number> => {
    try {
      const startTime = performance.now();
      await fetch(url, { method: 'HEAD', cache: 'no-cache', signal: AbortSignal.timeout(3000) });
      return performance.now() - startTime;
    } catch {
      return 0;
    }
  };

  // Enhanced quality calculation with improved scoring algorithm
  const calculateQuality = useCallback((networkType: string, speed: number, latency: number): number => {
    // Network type scoring with more nuanced categories
    const typeScores: { [key: string]: number } = {
      '4g': 7,
      '3g': 4,
      '2g': 2,
      'slow-2g': 1,
      'wifi': 8,
      'ethernet': 9,
      'cellular': 6,
      'bluetooth': 3,
      'wimax': 5,
      'unknown': 4,
    };
    
    const typeScore = typeScores[networkType.toLowerCase()] || 4;
    
    // Speed scoring with more granular levels (logarithmic scale)
    let speedScore = 1;
    if (speed >= 100) speedScore = 10;
    else if (speed >= 50) speedScore = 9;
    else if (speed >= 25) speedScore = 8;
    else if (speed >= 10) speedScore = 7;
    else if (speed >= 5) speedScore = 6;
    else if (speed >= 2) speedScore = 5;
    else if (speed >= 1) speedScore = 4;
    else if (speed >= 0.5) speedScore = 3;
    else if (speed >= 0.1) speedScore = 2;
    
    // Latency scoring with improved thresholds
    let latencyScore = 1;
    if (latency <= 20) latencyScore = 10;
    else if (latency <= 50) latencyScore = 9;
    else if (latency <= 100) latencyScore = 8;
    else if (latency <= 200) latencyScore = 7;
    else if (latency <= 300) latencyScore = 6;
    else if (latency <= 500) latencyScore = 5;
    else if (latency <= 1000) latencyScore = 4;
    else if (latency <= 2000) latencyScore = 3;
    else if (latency <= 3000) latencyScore = 2;
    
    // Enhanced weighted calculation: speed is most important, then latency, then type
    const qualityScore = Math.round((speedScore * 0.5 + latencyScore * 0.35 + typeScore * 0.15));
    
    // Ensure score is between 1-10 (never 0)
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

  // Start monitoring with delayed initial measurement for accuracy
  const startMonitoring = useCallback(async (delayInitialMeasurement = false) => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    console.log('🌐 Starting network quality monitoring...');
    
    if (delayInitialMeasurement) {
      console.log('⏱️ Waiting 15 seconds before initial measurement for accuracy...');
      // Wait 15 seconds for session to stabilize before initial measurement
      setTimeout(async () => {
        try {
          console.log('📊 Taking initial network quality measurement...');
          const initialQuality = await measureQuality();
          console.log('✅ Initial network quality:', initialQuality);
          setCurrentQuality(initialQuality);
          setMeasurements([initialQuality]);
        } catch (error) {
          console.error('❌ Initial measurement failed:', error);
          // Fallback quality if measurement fails
          const fallbackQuality = {
            quality: 5,
            networkType: 'unknown',
            speed: 1,
            latency: 1000,
            timestamp: Date.now()
          };
          setCurrentQuality(fallbackQuality);
          setMeasurements([fallbackQuality]);
        }
      }, 15000);
    } else {
      // Immediate measurement for non-critical contexts
      const initialQuality = await measureQuality();
      setCurrentQuality(initialQuality);
      setMeasurements([initialQuality]);
    }
    
    // Set up periodic monitoring (every 30 seconds)
    intervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 Periodic network measurement...');
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
    const stabilityScore = Math.max(0, Math.min(9.99, 10 - (standardDeviation * 2)));
    
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