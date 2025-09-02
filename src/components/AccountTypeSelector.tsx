import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, UserCheck, Users, TrendingUp } from 'lucide-react';
import Prism from '@/components/Prism';

interface AccountTypeSelectorProps {
  onSelectType: (type: 'empresa' | 'vendedor') => void;
}

const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Prism Background */}
      <div className="absolute inset-0 z-0">
        <Prism 
          animationType="rotate"
          scale={4}
          timeScale={0.3}
          glow={0.8}
          colorFrequency={0.5}
          noise={0.1}
          hueShift={0.5}
          bloom={1.2}
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 w-full max-w-4xl space-y-8 backdrop-blur-sm bg-background/20 rounded-2xl p-8 border border-white/10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/zoom%20hack%20logo%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy96b29tIGhhY2sgbG9nbyAoMSkucG5nIiwiaWF0IjoxNzU2NDAyNDY1LCJleHAiOjE5MTQwODI0NjV9.Y0gJgiDh2zvxJoep36_ykWIYdfo5SQjpMs0auWVkuTQ" 
              alt="Zoom Hack Logo" 
              className="h-32 w-auto object-contain dark:drop-shadow-none drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido a Zoom Hack
            </h1>
            <p className="text-muted-foreground">
              Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
            </p>
          </div>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Empresa Card */}
          <Card className="bg-card border-border hover:border-neon-cyan/50 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-cyan-glow/20 flex items-center justify-center group-hover:from-neon-cyan/30 group-hover:to-neon-cyan-glow/30 transition-all duration-300">
                  <Building2 className="w-10 h-10 text-neon-cyan" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">EMPRESA</h3>
                <p className="text-muted-foreground">
                  Panel administrativo para monitorear equipos de ventas
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 text-neon-cyan" />
                  <span>Genera códigos para tu equipo</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-neon-cyan" />
                  <span>Monitorea métricas de rendimiento</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4 text-neon-cyan" />
                  <span>Supervisa todos los vendedores</span>
                </div>
              </div>

              <Button
                onClick={() => onSelectType('empresa')}
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
                size="lg"
              >
                Iniciar como Empresa
              </Button>
            </CardContent>
          </Card>

          {/* Vendedor Card */}
          <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary/20 to-primary-glow/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary-glow/30 transition-all duration-300">
                  <UserCheck className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">VENDEDOR</h3>
                <p className="text-muted-foreground">
                  Herramienta completa de productividad para reuniones
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Análisis IA en tiempo real</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Gestión de sesiones de venta</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Opción de unirse a empresa</span>
                </div>
              </div>

              <Button
                onClick={() => onSelectType('vendedor')}
                className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
                size="lg"
              >
                Iniciar como Vendedor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            ¿No estás seguro? Puedes cambiar el tipo de cuenta más tarde desde tu perfil
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelector;