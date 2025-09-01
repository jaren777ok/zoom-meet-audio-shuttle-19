import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  SignalHigh, 
  SignalMedium, 
  SignalLow,
  Smartphone,
  Monitor 
} from 'lucide-react';
import { NetworkQuality } from '@/hooks/useNetworkQuality';

interface NetworkQualityIndicatorProps {
  quality: NetworkQuality | null;
  className?: string;
  showDetails?: boolean;
}

export const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({
  quality,
  className = "",
  showDetails = false
}) => {
  if (!quality) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">Sin medición</span>
      </div>
    );
  }

  // Get quality icon based on score
  const getQualityIcon = () => {
    if (quality.quality >= 8) return <Signal className="w-4 h-4" />;
    if (quality.quality >= 6) return <SignalHigh className="w-4 h-4" />;
    if (quality.quality >= 4) return <SignalMedium className="w-4 h-4" />;
    return <SignalLow className="w-4 h-4" />;
  };

  // Get network type icon
  const getNetworkTypeIcon = () => {
    const type = quality.networkType.toLowerCase();
    if (type.includes('wifi') || type.includes('ethernet')) {
      return <Wifi className="w-3 h-3" />;
    }
    return <Smartphone className="w-3 h-3" />;
  };

  // Get quality color
  const getQualityColor = () => {
    if (quality.quality >= 8) return 'text-green-500';
    if (quality.quality >= 6) return 'text-blue-500';
    if (quality.quality >= 4) return 'text-yellow-500';
    if (quality.quality >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get quality label
  const getQualityLabel = () => {
    if (quality.quality >= 8) return 'Excelente';
    if (quality.quality >= 6) return 'Buena';
    if (quality.quality >= 4) return 'Regular';
    if (quality.quality >= 2) return 'Mala';
    return 'Muy Mala';
  };

  // Get badge variant
  const getBadgeVariant = () => {
    if (quality.quality >= 6) return 'default';
    if (quality.quality >= 4) return 'secondary';
    return 'destructive';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getQualityColor()}`}>
        {getQualityIcon()}
        {getNetworkTypeIcon()}
      </div>
      
      <Badge variant={getBadgeVariant()} className="text-xs">
        {getQualityLabel()} ({quality.quality}/10)
      </Badge>
      
      {showDetails && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{quality.speed} Mbps</span>
          <span>•</span>
          <span>{quality.latency}ms</span>
          <span>•</span>
          <span className="capitalize">{quality.networkType}</span>
        </div>
      )}
    </div>
  );
};