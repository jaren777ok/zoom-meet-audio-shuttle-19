import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Building, Target } from 'lucide-react';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

interface MeetingInfoFormProps {
  onSubmit: (meetingInfo: MeetingInfo) => void;
}

const MeetingInfoForm = ({ onSubmit }: MeetingInfoFormProps) => {
  const [numberOfPeople, setNumberOfPeople] = useState<number>(2);
  const [companyInfo, setCompanyInfo] = useState('');
  const [meetingObjective, setMeetingObjective] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        numberOfPeople,
        companyInfo: companyInfo.trim(),
        meetingObjective: meetingObjective.trim()
      });
    }
  };

  return (
    <Card className="bg-card border-border backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-foreground">
          <Target className="h-5 w-5 text-neon-cyan" />
          Información de la Reunión
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Completa los datos antes de iniciar la grabación
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Número de Personas */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPeople" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neon-cyan" />
              Cuántas Personas Estarán en la Reunión
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
            <Label htmlFor="companyInfo" className="flex items-center gap-2">
              <Building className="h-4 w-4 text-neon-cyan" />
              Información de la Empresa
            </Label>
            <Input
              id="companyInfo"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              placeholder="Ej. Acme Corp, Departamento de Ventas"
              className={`bg-input border-border ${errors.companyInfo ? 'border-destructive' : ''}`}
            />
            {errors.companyInfo && (
              <p className="text-sm text-destructive">{errors.companyInfo}</p>
            )}
          </div>

          {/* Objetivo de la Reunión */}
          <div className="space-y-2">
            <Label htmlFor="meetingObjective" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-neon-cyan" />
              Objetivo de la Reunión
            </Label>
            <Textarea
              id="meetingObjective"
              value={meetingObjective}
              onChange={(e) => setMeetingObjective(e.target.value)}
              placeholder="Describe el propósito y objetivos principales de esta reunión..."
              className={`bg-input border-border min-h-[100px] ${errors.meetingObjective ? 'border-destructive' : ''}`}
            />
            {errors.meetingObjective && (
              <p className="text-sm text-destructive">{errors.meetingObjective}</p>
            )}
          </div>

          <Button 
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
          >
            Continuar a Grabación
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeetingInfoForm;