import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch account type when user changes
        if (session?.user) {
          setTimeout(() => {
            fetchAccountType(session.user.id);
          }, 0);
        } else {
          setAccountType(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchAccountType(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAccountType = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', userId)
        .single();
      
      setAccountType(profile?.account_type || null);
    } catch (error) {
      console.error('Error fetching account type:', error);
      setAccountType(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Error de autenticación",
          description: error.message === 'Invalid login credentials' 
            ? 'Credenciales incorrectas' 
            : error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al iniciar sesión",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Error de registro",
          description: error.message === 'User already registered' 
            ? 'El usuario ya está registrado' 
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al crear la cuenta",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    accountType,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};