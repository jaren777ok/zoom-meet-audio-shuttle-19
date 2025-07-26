import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Minimize2, 
  Maximize2, 
  X, 
  PictureInPicture2,
  MessageSquare,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAIMessagesContext } from '@/contexts/AIMessagesContext';
import { usePictureInPicture } from '@/hooks/usePictureInPicture';
import { MessageBubble } from './MessageBubble';
import { ConnectionStatus } from './ConnectionStatus';

interface FloatingAIChatProps {
  isVisible: boolean;
  onClose: () => void;
  onStopRecording: () => void;
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ 
  isVisible, 
  onClose,
  onStopRecording 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    isConnected, 
    error, 
    unreadCount, 
    markAsRead,
    forceRefresh
  } = useAIMessagesContext(); // Use global context for consistent state

  const { 
    isPiPSupported, 
    isPiPActive, 
    openPictureInPicture, 
    closePictureInPicture 
  } = usePictureInPicture({ width: 400, height: 500 });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isVisible && messagesEndRef.current) {
      console.log('🔄 Auto-scrolling to latest message. Total messages:', messages.length);
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isVisible]);

  // Mark messages as read when chat is visible and expanded
  useEffect(() => {
    if (!isMinimized && isVisible && unreadCount > 0) {
      console.log('✅ Marking messages as read. Unread count:', unreadCount);
      markAsRead();
    }
  }, [isMinimized, isVisible, unreadCount, markAsRead]);

  // Log messages updates for debugging
  useEffect(() => {
    console.log('💬 FloatingAIChat messages updated:', {
      count: messages.length,
      isVisible,
      isConnected,
      unreadCount
    });
  }, [messages.length, isVisible, isConnected, unreadCount]);

  const handlePictureInPicture = () => {
    if (isPiPActive) {
      closePictureInPicture();
    } else if (chatContainerRef.current) {
      openPictureInPicture(chatContainerRef.current);
    }
  };

  const handleClose = () => {
    console.log('🚪 Closing FloatingAIChat (messages persist)');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card 
        className={`
          bg-background/95 backdrop-blur-sm border-primary/20 shadow-2xl
          transition-all duration-300 ease-in-out
          ${isMinimized ? 'h-14' : 'h-96'}
          w-80
        `}
      >
        <CardHeader className="pb-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">IA Coach Live</span>
                <span className="text-xs text-muted-foreground">({messages.length})</span>
              </div>
              {unreadCount > 0 && !isMinimized && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <ConnectionStatus 
                isConnected={isConnected} 
                error={error} 
                className="mr-2" 
              />
              
              {!isConnected && !isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={forceRefresh}
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                  title="Refresh messages"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
              
              {isPiPSupported && !isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePictureInPicture}
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                >
                  <PictureInPicture2 className="w-3 h-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 hover:bg-primary/20"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 h-80">
            <div 
              ref={chatContainerRef}
              className="h-full flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">
                      Esperando mensajes de IA...
                    </p>
                    <p className="text-xs mt-1">
                      Los insights aparecerán durante la grabación
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={`${message.id}-${index}`}
                        message={message}
                        isNew={index === messages.length - 1}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>
          </CardContent>
        )}

        {isMinimized && unreadCount > 0 && (
          <div className="absolute -top-2 -right-2">
            <Badge 
              variant="destructive" 
              className="h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </div>
        )}
      </Card>
    </div>
  );
};