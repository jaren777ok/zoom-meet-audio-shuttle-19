import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Star, 
  Calendar,
  ChevronRight,
  BarChart3 
} from 'lucide-react';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface VendorCardProps {
  vendor: VendorMetrics;
  rank?: number;
  onViewDetails: (vendorId: string) => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, rank, onViewDetails }) => {
  const getInitials = (name: string | null) => {
    if (!name) return 'V';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excelente' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Bueno' };
    return { variant: 'destructive' as const, label: 'Necesita Mejora' };
  };

  const performanceBadge = getPerformanceBadge(vendor.performance_score);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {rank && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                #{rank}
              </div>
            )}
            <Avatar className="h-12 w-12">
              <AvatarImage src={vendor.profile_photo_url} alt={vendor.vendor_name || 'Vendedor'} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(vendor.vendor_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {vendor.vendor_name || 'Sin nombre'}
              </h3>
              <p className="text-sm text-muted-foreground">{vendor.vendor_email}</p>
              <Badge variant={performanceBadge.variant} className="mt-1">
                {performanceBadge.label}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(vendor.vendor_id)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Ver Métricas
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Sesiones</p>
              <p className="font-semibold">{vendor.total_sessions}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Ventas</p>
              <p className="font-semibold">{vendor.total_sales}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Conversión</p>
              <p className="font-semibold">{vendor.conversion_rate.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
            <Star className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">Satisfacción</p>
              <p className="font-semibold">{vendor.avg_satisfaction.toFixed(1)}/5</p>
            </div>
          </div>
        </div>

        {/* Revenue and Performance Score */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400">Ingresos Generados</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-300">
              ${vendor.total_revenue.toLocaleString()}
            </p>
          </div>
          
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Puntuación</p>
            <p className={`text-xl font-bold ${getPerformanceColor(vendor.performance_score)}`}>
              {vendor.performance_score}/100
            </p>
          </div>
        </div>

        {/* Last Activity */}
        {vendor.last_session_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Última sesión: {formatDistanceToNow(new Date(vendor.last_session_date), { 
                addSuffix: true, 
                locale: es 
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorCard;