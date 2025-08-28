import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserCheck, Target, TrendingUp } from 'lucide-react';

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-cyan-glow bg-clip-text text-transparent flex items-center justify-center gap-1">
              <span>Z</span>
              <Target className="h-8 w-8 text-neon-cyan mx-1" />
              <span>M HACK</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Tu herramienta de productividad para Zoom impulsada por IA
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-foreground">
              <UserCheck className="h-5 w-5 text-neon-cyan" />
              Iniciar Sesión
            </CardTitle>
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