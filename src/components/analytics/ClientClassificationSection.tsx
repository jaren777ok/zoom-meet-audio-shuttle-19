import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SessionMetrics } from '@/hooks/useSessionAnalytics';

interface ClientClassificationSectionProps {
  metrics: SessionMetrics;
}

const ClientClassificationSection: React.FC<ClientClassificationSectionProps> = ({ metrics }) => {
  const output = metrics;

  // Función para obtener color de temperatura del lead
  const getLeadTemperatureVariant = (temperature: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (temperature.toLowerCase()) {
      case 'caliente':
        return 'destructive'; // Rojo
      case 'tibio':
        return 'secondary'; // Naranja/amarillo
      case 'frío':
        return 'outline'; // Azul
      default:
        return 'default';
    }
  };

  // Función para obtener emoji de temperatura del lead
  const getLeadTemperatureEmoji = (temperature: string): string => {
    switch (temperature.toLowerCase()) {
      case 'caliente':
        return '🔥';
      case 'tibio':
        return '🌡️';
      case 'frío':
        return '❄️';
      default:
        return '🌡️';
    }
  };

  // Función para obtener color de intención de compra
  const getPurchaseIntentVariant = (intent: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (intent.toLowerCase()) {
      case 'alta':
        return 'default'; // Verde
      case 'media':
        return 'secondary'; // Amarillo
      case 'baja':
        return 'outline'; // Gris
      default:
        return 'default';
    }
  };

  // Función para obtener emoji de intención de compra
  const getPurchaseIntentEmoji = (intent: string): string => {
    switch (intent.toLowerCase()) {
      case 'alta':
        return '🎯';
      case 'media':
        return '📊';
      case 'baja':
        return '📉';
      default:
        return '📊';
    }
  };

  // Función para obtener color y emoji de sentimiento
  const getSentimentData = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positivo':
        return { 
          variant: 'default' as const, 
          emoji: '😊', 
          className: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200' 
        };
      case 'negativo':
        return { 
          variant: 'destructive' as const, 
          emoji: '😠', 
          className: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200' 
        };
      case 'neutro':
        return { 
          variant: 'outline' as const, 
          emoji: '😐', 
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200' 
        };
      default:
        return { 
          variant: 'default' as const, 
          emoji: '😐', 
          className: '' 
        };
    }
  };

  const sentimentData = getSentimentData(output.Sentimiento_cliente);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Clasificación del Cliente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Temperatura del Lead */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Temperatura del Lead</h3>
           <Badge 
            variant={getLeadTemperatureVariant(output.Temperatura_Lead)}
            className={`
              text-sm px-3 py-1
              ${output.Temperatura_Lead.toLowerCase() === 'caliente' 
                ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200' 
                : output.Temperatura_Lead.toLowerCase() === 'tibio'
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
              }
            `}
          >
            <span className="mr-1">{getLeadTemperatureEmoji(output.Temperatura_Lead)}</span>
            {output.Temperatura_Lead}
          </Badge>
        </div>

        {/* Intención de Compra */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Intención de Compra</h3>
          <Badge 
            variant={getPurchaseIntentVariant(output.Intención_compra)}
            className={`
              text-sm px-3 py-1
              ${output.Intención_compra.toLowerCase() === 'alta' 
                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200' 
                : output.Intención_compra.toLowerCase() === 'media'
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
              }
            `}
          >
            <span className="mr-1">{getPurchaseIntentEmoji(output.Intención_compra)}</span>
            {output.Intención_compra}
          </Badge>
        </div>

        {/* Sentimiento del Cliente */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Sentimiento del Cliente</h3>
          <Badge 
            variant={sentimentData.variant}
            className={`text-sm px-3 py-1 ${sentimentData.className}`}
          >
            <span className="mr-1">{sentimentData.emoji}</span>
            {output.Sentimiento_cliente}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ClientClassificationSection;