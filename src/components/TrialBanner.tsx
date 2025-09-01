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
    <Card className="bg-gradient-to-r from-zoom-blue/10 to-zoom-blue-light/10 border-zoom-blue/30 backdrop-blur-sm shadow-zoom">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-zoom-blue" />
          <span className="text-foreground">
            <span className="font-semibold text-zoom-blue">Prueba Gratuita:</span>
            {' '}Te quedan <span className="font-bold text-zoom-blue">{daysRemaining}</span> días
          </span>
          <Clock className="h-4 w-4 text-zoom-blue" />
        </div>
      </CardContent>
    </Card>
  );
};