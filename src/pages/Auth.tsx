import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import zoomHackLogo from '@/assets/zoom-hack-logo.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { user, signIn, signUp, loading } = useAuth();

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Main Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src={zoomHackLogo} 
              alt="ZOOM HACK Logo" 
              className="w-16 h-16 object-contain"
            />
            <h1 className="text-4xl font-bold text-foreground">
              ZOOM HACK
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Sistema inteligente de grabación para sesiones de coaching en tiempo real
          </p>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md border-2 border-primary/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-primary">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin ? 'Accede a tu cuenta' : 'Obtén 7 días de prueba gratuita'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="border-primary/20 focus:border-primary"
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
                    className="border-primary/20 focus:border-primary pr-10"
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
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                disabled={isSubmitting}
              >
                {isSubmitting ? 
                  (isLogin ? 'Iniciando sesión...' : 'Creando cuenta...') : 
                  (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
                }
              </Button>

              {/* Switch Auth Mode */}
              <div className="text-center mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline p-0 h-auto"
                >
                  {isLogin ? 'Crear cuenta gratuita' : 'Iniciar sesión'}
                </Button>
              </div>

              {/* Forgot Password Link - Only for Login */}
              {isLogin && (
                <div className="text-center mt-2">
                  <a
                    href="https://wa.me/525547790027?text=Hola,%20necesito%20ayuda%20para%20recuperar%20mi%20contraseña%20de%20ZOOM%20HACK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
                <img 
                  src={zoomHackLogo} 
                  alt="ZOOM HACK Logo" 
                  className="w-5 h-5 object-contain"
                />
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