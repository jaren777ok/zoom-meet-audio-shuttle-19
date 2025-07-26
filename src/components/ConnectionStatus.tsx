import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  error, 
  className = "" 
}) => {
  if (error) {
    return (
      <div className={`flex items-center gap-1 text-destructive ${className}`} title={error}>
        <AlertCircle className="w-3 h-3" />
        <span className="text-xs">Error</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${isConnected ? 'text-green-400' : 'text-orange-400'} ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span className="text-xs">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 animate-pulse" />
          <span className="text-xs">Conectando...</span>
        </>
      )}
    </div>
  );
};