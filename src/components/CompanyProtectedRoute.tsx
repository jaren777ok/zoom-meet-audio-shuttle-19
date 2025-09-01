import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface CompanyProtectedRouteProps {
  children: React.ReactNode;
}

const CompanyProtectedRoute: React.FC<CompanyProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);

  useEffect(() => {
    const checkAccountType = async () => {
      if (!user) {
        setIsCheckingAccount(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();

        setAccountType(profile?.account_type || null);
      } catch (error) {
        console.error('Error checking account type:', error);
        setAccountType(null);
      } finally {
        setIsCheckingAccount(false);
      }
    };

    checkAccountType();
  }, [user]);

  if (loading || isCheckingAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (accountType !== 'empresa') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default CompanyProtectedRoute;