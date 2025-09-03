import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Home, Brain, History, BarChart3, LogOut, Sun, Moon, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import faviconZoom from '@/assets/favicon-zoom.png';

const AppNavigation: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio', description: 'Grabación de audio' },
    { path: '/knowledge', icon: Brain, label: 'Conocimiento', description: 'Documentos IA' },
    { path: '/sessions', icon: History, label: 'Sesiones', description: 'Historial' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Análisis de rendimiento' },
    { path: '/vendor-company', icon: Building2, label: 'Empresa', description: 'Asociación empresarial' },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/zoom%20hack%20logo%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy96b29tIGhhY2sgbG9nbyAoMSkucG5nIiwiaWF0IjoxNzU2OTM1MjA4LCJleHAiOjE5MTQ2MTUyMDh9.ODrXHm4tQAkJDB0GmWRMyMPeVRaRxpypsRPhqodG_qc" 
              alt="Zoom Hack" 
              className="h-8 w-auto object-contain dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-[2px_2px_6px_rgba(0,0,0,0.8)]" 
            />
            {user?.email && (
              <Badge variant="outline" className="ml-2">
                {user.email}
              </Badge>
            )}
          </div>
          
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant={isActive(item.path) ? "default" : "ghost"} 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
            
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </nav>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppNavigation;