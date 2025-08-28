import React from 'react';
import { Clock, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

export const TrialBanner: React.FC = () => {
  const { subscription, daysRemaining, isTrialExpired, loading } = useSubscription();

  if (loading || !subscription) return null;

  if (subscription.subscription_type === 'premium') {
    return (
      <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700">
              ¡Acceso Premium Activado!
            </p>
            <p className="text-xs text-amber-600">
              Disfruta de todas las funciones sin límites
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isTrialExpired) {
    return (
      <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">
              Prueba Gratuita Expirada
            </p>
            <p className="text-xs text-red-600">
              Solicita acceso premium para continuar usando ZOOM HACK
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500/10 to-primary/10 border-primary/20 p-4 mb-6">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-primary">
            Prueba Gratuita - {daysRemaining} {daysRemaining === 1 ? 'día restante' : 'días restantes'}
          </p>
          <p className="text-xs text-muted-foreground">
            Explora todas las funciones durante tu período de prueba
          </p>
        </div>
      </div>
    </Card>
  );
};