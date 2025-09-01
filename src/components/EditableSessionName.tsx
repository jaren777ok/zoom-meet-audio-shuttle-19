import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
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
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <span className="text-sm font-medium">{sessionName}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default EditableSessionName;