import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Brain, History, BarChart3, LogOut, Sun, Moon } from 'lucide-react';
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
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={faviconZoom} alt="Favicon" className="h-6 w-6" />
            <span className="font-bold text-lg">ZOOM HACK</span>
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
            </Button>
            
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