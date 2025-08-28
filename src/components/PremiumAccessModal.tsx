import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Sparkles } from 'lucide-react';

interface PremiumAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export const PremiumAccessModal: React.FC<PremiumAccessModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { submitPremiumRequest } = useSubscription();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    full_name: '',
    phone_number: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const success = await submitPremiumRequest({
      user_id: user.id,
      email: formData.email,
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      message: formData.message,
      status: 'pending'
    });

    if (success) {
      onClose();
      setFormData({
        email: user.email || '',
        full_name: '',
        phone_number: '',
        message: ''
      });
    }
    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Acceso Premium
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            ¿Te gustó la experiencia? Solicita acceso completo a ZOOM HACK y lleva tu entrenamiento al siguiente nivel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo Electrónico *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              Nombre Completo *
            </Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-sm font-medium">
              Número de Teléfono *
            </Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              required
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Mensaje (Opcional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia y por qué quieres continuar..."
              className="border-primary/20 focus:border-primary min-h-[80px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-primary/20 hover:bg-primary/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.full_name || !formData.phone_number}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Solicitar Acceso
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};