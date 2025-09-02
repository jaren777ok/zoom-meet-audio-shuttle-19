import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, UserCheck, UserPlus, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Prism from '@/components/Prism';

interface AuthVendedorProps {
  onBack: () => void;
}

const AuthVendedor: React.FC<AuthVendedorProps> = ({ onBack }) => {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
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
      await signIn(email, password);
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
    
    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password);
      
      if (!error) {
        // Wait for the user to be created and then update profile
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          // Verify company code if provided
          let validCompanyCode = null;
          if (companyCode.trim()) {
            const { data: companyData } = await supabase
              .from('company_accounts')
              .select('company_code')
              .eq('company_code', companyCode.trim())
              .single();

            if (!companyData) {
              toast({
                title: "Código inválido",
                description: "El código de empresa ingresado no es válido",
                variant: "destructive",
              });
              return;
            }
            validCompanyCode = companyCode.trim();
          }

          // Update profile
          await supabase
            .from('profiles')
            .update({ 
              account_type: 'vendedor',
              company_code: validCompanyCode
            })
            .eq('id', session.session.user.id);

          if (validCompanyCode) {
            toast({
              title: "¡Cuenta creada!",
              description: "Te has unido exitosamente a tu empresa",
            });
          } else {
            toast({
              title: "¡Cuenta creada!",
              description: "Puedes unirte a una empresa más tarde desde tu perfil",
            });
          }
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
          animationType="3drotate"
          scale={4.2}
          timeScale={0.2}
          glow={0.9}
          colorFrequency={1.2}
          noise={0.08}
          hueShift={1.8}
          bloom={1.3}
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
              <UserCheck className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Cuenta Vendedor</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Herramienta de productividad para reuniones
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="bg-card/30 border-white/20 backdrop-blur-md shadow-2xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none h-12">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
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
                      className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Procesando...' : 'Iniciar Sesión'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <a
                      href="https://inmuebla-ia-login.lovable.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      ¿Olvidaste tu Contraseña?
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-center text-muted-foreground">
                      🎉 <span className="font-semibold text-primary">¡Prueba gratuita de 7 días!</span> 
                      <br />Regístrate y comienza a multiplicar tu productividad
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Correo electrónico</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
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

                    <div className="space-y-2">
                      <Label htmlFor="company-code" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Código de empresa (opcional)
                      </Label>
                      <Input
                        id="company-code"
                        type="text"
                        value={companyCode}
                        onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                        placeholder="ZH-ABC123"
                        className="bg-input border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si perteneces a una empresa, ingresa el código que te proporcionaron
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta Gratis'}
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

export default AuthVendedor;