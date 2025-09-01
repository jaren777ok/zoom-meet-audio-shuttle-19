import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:bg-white/10 z-10"
        >
          <X className="h-6 w-6" />
        </Button>
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};