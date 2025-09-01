import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, UserCheck, UserPlus, Target, TrendingUp } from 'lucide-react';
import zoomHackLogo from '@/assets/zoom-hack-logo.png';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      alert('Las contraseñas no coinciden');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signUp(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/zoom%20hack%20logo%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy96b29tIGhhY2sgbG9nbyAoMSkucG5nIiwiaWF0IjoxNzU2NDAyNDY1LCJleHAiOjE5MTQwODI0NjV9.Y0gJgiDh2zvxJoep36_ykWIYdfo5SQjpMs0auWVkuTQ" 
              alt="Zoom Hack Logo" 
              className="h-40 w-auto object-contain dark:drop-shadow-none drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]"
            />
          </div>
          <div>
            <p className="text-muted-foreground mt-2">
              Tu herramienta de productividad para Zoom impulsada por IA
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="bg-card border-border backdrop-blur-sm">
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
                      className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
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
                      className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors underline"
                    >
                      ¿Olvidaste tu Contraseña?
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <div className="mb-4 p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                    <p className="text-sm text-center text-muted-foreground">
                      🎉 <span className="font-semibold text-neon-cyan">¡Prueba gratuita de 7 días!</span> 
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

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300"
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

        {/* Info Card */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-neon-cyan" />
                Zoom Hack 10X
              </h3>
              <p className="text-sm text-muted-foreground">
                Multiplica tu productividad hasta 10X con análisis de IA en tiempo real
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;