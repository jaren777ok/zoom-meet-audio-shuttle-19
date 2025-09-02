import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Building2, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Prism from '@/components/Prism';

interface AuthCompanyProps {
  onBack: () => void;
}

const AuthCompany: React.FC<AuthCompanyProps> = ({ onBack }) => {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (!error) {
        // Check if this user has a company account after successful login
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('account_type')
            .eq('id', session.session.user.id)
            .single();
          
          if (profile?.account_type !== 'empresa') {
            toast({
              title: "Acceso denegado",
              description: "Esta cuenta no está configurada como empresa",
              variant: "destructive",
            });
            await supabase.auth.signOut();
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (!companyName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es obligatorio",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password);
      
      if (!error) {
        // Wait for the user to be created and then update profile
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          // Generate company code
          const { data: companyCode } = await supabase
            .rpc('generate_company_code');

          // Update profile to company type
          await supabase
            .from('profiles')
            .update({ account_type: 'empresa' })
            .eq('id', session.session.user.id);

          // Create company account
          await supabase
            .from('company_accounts')
            .insert({
              user_id: session.session.user.id,
              company_name: companyName.trim(),
              company_code: companyCode
            });

          toast({
            title: "¡Cuenta creada exitosamente!",
            description: `Tu código de empresa es: ${companyCode}. Compártelo con tu equipo.`,
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Prism Background */}
      <div className="absolute inset-0 z-0">
        <Prism 
          animationType="hover"
          scale={3.5}
          timeScale={0.4}
          glow={1.2}
          colorFrequency={0.8}
          noise={0.05}
          hueShift={2.5}
          bloom={1.5}
          hoverStrength={1.5}
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-8 w-8 text-neon-cyan" />
              <h1 className="text-2xl font-bold text-foreground">Cuenta Empresa</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Panel administrativo para equipos de ventas
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="bg-card/30 border-white/20 backdrop-blur-md shadow-2xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none h-12">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Crear Empresa
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico empresarial</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@tuempresa.com"
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="bg-input border-border pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Procesando...' : 'Acceder al Panel'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nombre de la empresa</Label>
                      <Input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Mi Empresa S.A."
                        required
                        className="bg-input border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Correo electrónico</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@tuempresa.com"
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="bg-input border-border pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="bg-input border-border pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground bg-neon-cyan/10 p-3 rounded-lg border border-neon-cyan/20">
                      <p className="font-medium text-neon-cyan mb-1">¿Qué obtienes?</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Código único para tu equipo</li>
                        <li>• Panel de monitoreo en tiempo real</li>
                        <li>• Métricas de rendimiento consolidadas</li>
                      </ul>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creando empresa...' : 'Crear Cuenta Empresarial'}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthCompany;