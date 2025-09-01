import React, { useState } from 'react';
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableSessionNameProps {
  sessionName: string;
  onSave: (newName: string) => Promise<boolean>;
  className?: string;
}

const EditableSessionName: React.FC<EditableSessionNameProps> = ({
  sessionName,
  onSave,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(sessionName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === sessionName || !editValue.trim()) {
      setIsEditing(false);
      setEditValue(sessionName);
      return;
    }

    setIsLoading(true);
    try {
      const success = await onSave(editValue.trim());
      if (success) {
        setIsEditing(false);
      } else {
        setEditValue(sessionName);
      }
    } catch (error) {
      console.error('Error saving session name:', error);
      setEditValue(sessionName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(sessionName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    const isLargeText = className?.includes('text-2xl') || className?.includes('text-3xl');
    
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${isLargeText ? 'h-12 text-2xl font-bold' : 'h-8 text-sm'}`}
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className={`p-0 ${isLargeText ? 'h-12 w-12' : 'h-8 w-8'}`}
        >
          <Check className={isLargeText ? "h-6 w-6" : "h-4 w-4"} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className={`p-0 ${isLargeText ? 'h-12 w-12' : 'h-8 w-8'}`}
        >
          <X className={isLargeText ? "h-6 w-6" : "h-4 w-4"} />
        </Button>
      </div>
    );
  }

  const isLargeText = className?.includes('text-2xl') || className?.includes('text-3xl');
  
  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <span className={className?.includes('text-') ? '' : "text-sm font-medium"}>{sessionName}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className={`p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
          isLargeText ? 'h-10 w-10' : 'h-8 w-8'
        }`}
      >
        <Edit2 className={isLargeText ? "h-5 w-5" : "h-3 w-3"} />
      </Button>
    </div>
  );
};

export default EditableSessionName;