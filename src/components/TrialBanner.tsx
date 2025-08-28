import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';

interface TrialBannerProps {
  daysRemaining: number;
  isVisible: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ daysRemaining, isVisible }) => {
  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-cyan-glow/10 border-neon-cyan/30 backdrop-blur-sm">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-neon-cyan" />
          <span className="text-foreground">
            <span className="font-semibold text-neon-cyan">Prueba Gratuita:</span>
            {' '}Te quedan <span className="font-bold text-neon-cyan">{daysRemaining}</span> días
          </span>
          <Clock className="h-4 w-4 text-neon-cyan" />
        </div>
      </CardContent>
    </Card>
  );
};