import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Building, Target } from 'lucide-react';
import { useMeetingConfiguration, MeetingConfiguration } from '@/hooks/useMeetingConfiguration';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

interface MeetingInfoFormProps {
  onSubmit: (meetingInfo: MeetingInfo) => void;
}

const MeetingInfoForm = ({ onSubmit }: MeetingInfoFormProps) => {
  const { config, saveConfiguration, isLoading } = useMeetingConfiguration();
  const [numberOfPeople, setNumberOfPeople] = useState<number>(config.numberOfPeople);
  const [companyInfo, setCompanyInfo] = useState(config.companyInfo);
  const [meetingObjective, setMeetingObjective] = useState(config.meetingObjective);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form fields when configuration loads
  useEffect(() => {
    setNumberOfPeople(config.numberOfPeople);
    setCompanyInfo(config.companyInfo);
    setMeetingObjective(config.meetingObjective);
  }, [config]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Debe haber al menos 1 persona';
    }
    
    if (!companyInfo.trim()) {
      newErrors.companyInfo = 'La información de la empresa es obligatoria';
    }
    
    if (!meetingObjective.trim()) {
      newErrors.meetingObjective = 'El objetivo de la reunión es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const meetingInfo = {
        numberOfPeople,
        companyInfo: companyInfo.trim(),
        meetingObjective: meetingObjective.trim()
      };
      
      // Save configuration before submitting
      await saveConfiguration(meetingInfo);
      
      onSubmit(meetingInfo);
    }
  };

  return (
    <Card className="bg-card border-border backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-foreground">
          <Target className="h-5 w-5 text-neon-cyan" />
          Configuración de tu Sesión de Coaching
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Prepara tu entrenamiento de ventas personalizado
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Número de Personas */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPeople" className="flex items-start gap-2">
              <Users className="h-4 w-4 text-neon-cyan flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">¿Cuántos prospectos/clientes estarán presentes?</span>
            </Label>
            <Input
              id="numberOfPeople"
              type="number"
              min="1"
              max="100"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(parseInt(e.target.value) || 1)}
              className={`bg-input border-border ${errors.numberOfPeople ? 'border-destructive' : ''}`}
            />
            {errors.numberOfPeople && (
              <p className="text-sm text-destructive">{errors.numberOfPeople}</p>
            )}
          </div>

          {/* Información de la Empresa */}
          <div className="space-y-2">
            <Label htmlFor="companyInfo" className="flex items-start gap-2">
              <Building className="h-4 w-4 text-neon-cyan flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">Contexto de tu Empresa y Productos</span>
            </Label>
            <Textarea
              id="companyInfo"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              placeholder="Describe tus productos, mercado objetivo, propuesta de valor única, precios, competencia y cualquier información que ayude a la IA a potenciar tu estrategia de ventas..."
              className={`bg-input border-border min-h-[120px] resize-y ${errors.companyInfo ? 'border-destructive' : ''}`}
            />
            {errors.companyInfo && (
              <p className="text-sm text-destructive">{errors.companyInfo}</p>
            )}
          </div>

          {/* Objetivo de la Reunión */}
          <div className="space-y-2">
            <Label htmlFor="meetingObjective" className="flex items-start gap-2">
              <Target className="h-4 w-4 text-neon-cyan flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">Meta de Ventas de esta Sesión</span>
            </Label>
            <Textarea
              id="meetingObjective"
              value={meetingObjective}
              onChange={(e) => setMeetingObjective(e.target.value)}
              placeholder="¿Qué quieres lograr? (cerrar venta, generar interés, seguimiento, etc.)"
              className={`bg-input border-border min-h-[100px] ${errors.meetingObjective ? 'border-destructive' : ''}`}
            />
            {errors.meetingObjective && (
              <p className="text-sm text-destructive">{errors.meetingObjective}</p>
            )}
          </div>

          <Button 
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Cargando configuración...' : 'Iniciar Coaching de Ventas'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeetingInfoForm;