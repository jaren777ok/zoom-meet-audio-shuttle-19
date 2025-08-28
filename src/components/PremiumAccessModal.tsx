import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Zap, Target, TrendingUp } from 'lucide-react';

interface PremiumAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    full_name: string;
    email: string;
    phone_number: string;
    message?: string;
  }) => Promise<{ success: boolean }>;
}

export const PremiumAccessModal: React.FC<PremiumAccessModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.phone_number) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        setFormData({ full_name: '', email: '', phone_number: '', message: '' });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-yellow-400" />
            Acceso Premium a Zoom Hack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits Section */}
          <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-cyan-glow/10 border-neon-cyan/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Zap className="h-8 w-8 text-neon-cyan mx-auto" />
                  <h3 className="font-semibold text-foreground">Análisis Ilimitado</h3>
                  <p className="text-sm text-muted-foreground">
                    Sin límites de tiempo ni sesiones
                  </p>
                </div>
                <div className="space-y-2">
                  <Target className="h-8 w-8 text-neon-cyan mx-auto" />
                  <h3 className="font-semibold text-foreground">IA Avanzada</h3>
                  <p className="text-sm text-muted-foreground">
                    Coaching personalizado en tiempo real
                  </p>
                </div>
                <div className="space-y-2">
                  <TrendingUp className="h-8 w-8 text-neon-cyan mx-auto" />
                  <h3 className="font-semibold text-foreground">Resultados 10X</h3>
                  <p className="text-sm text-muted-foreground">
                    Multiplica tu productividad
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trial Expired Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Tu prueba gratuita ha expirado
            </h3>
            <p className="text-muted-foreground">
              Completa el formulario para solicitar acceso premium y continuar mejorando tus habilidades de venta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="bg-input border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Número de Teléfono *</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="+1 234 567 8900"
                required
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (Opcional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Cuéntanos sobre tu experiencia con Zoom Hack o cualquier pregunta que tengas..."
                rows={3}
                className="bg-input border-border resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90"
                disabled={isSubmitting || !formData.full_name || !formData.email || !formData.phone_number}
              >
                {isSubmitting ? 'Enviando...' : 'Solicitar Acceso Premium'}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Nos pondremos en contacto contigo en las próximas 24 horas para activar tu acceso premium
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};