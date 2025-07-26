import React from 'react';
import { Brain, Lightbulb, Target, FileText, MessageCircle } from 'lucide-react';
import { AIMessage } from '@/hooks/useAIMessages';

interface MessageBubbleProps {
  message: AIMessage;
  isNew?: boolean;
}

const getMessageIcon = (type: string) => {
  switch (type) {
    case 'analysis':
      return <Brain className="w-4 h-4 text-primary" />;
    case 'insight':
      return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    case 'suggestion':
      return <Target className="w-4 h-4 text-green-400" />;
    case 'summary':
      return <FileText className="w-4 h-4 text-blue-400" />;
    default:
      return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const getMessageTypeLabel = (type: string) => {
  switch (type) {
    case 'analysis':
      return 'Análisis';
    case 'insight':
      return 'Insight';
    case 'suggestion':
      return 'Sugerencia';
    case 'summary':
      return 'Resumen';
    default:
      return 'Mensaje';
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isNew = false }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`
        bg-card border border-border rounded-lg p-3 mb-3 
        transition-all duration-300 ease-in-out
        ${isNew ? 'animate-fade-in scale-in' : ''}
        hover:shadow-md hover:shadow-primary/20
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getMessageIcon(message.message_type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {getMessageTypeLabel(message.message_type)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
          
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
          
          {message.confidence && message.confidence < 1 && (
            <div className="mt-2 flex items-center gap-1">
              <div className="text-xs text-muted-foreground">
                Confianza: {Math.round(message.confidence * 100)}%
              </div>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${message.confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};