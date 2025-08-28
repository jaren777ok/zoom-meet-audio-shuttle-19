import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type: string;
  trial_start_date: string;
  trial_end_date: string;
  created_at: string;
  updated_at: string;
}

interface PremiumAccessRequest {
  full_name: string;
  email: string;
  phone_number: string;
  message?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
      setSubscription(null);
      setIsTrialActive(false);
      setDaysRemaining(0);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if user has a subscription
      const { data: existingSubscription, error } = await supabase
        .from('user_subscriptions' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (!existingSubscription) {
        // Create new trial subscription for new user
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const { data: newSubscription, error: insertError } = await supabase
          .from('user_subscriptions' as any)
          .insert({
            user_id: user.id,
            subscription_type: 'trial',
            trial_end_date: trialEndDate.toISOString()
          } as any)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating subscription:', insertError);
          return;
        }

        setSubscription(newSubscription as unknown as UserSubscription);
        calculateTrialStatus(newSubscription as unknown as UserSubscription);
      } else {
        setSubscription(existingSubscription as unknown as UserSubscription);
        calculateTrialStatus(existingSubscription as unknown as UserSubscription);
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrialStatus = (sub: UserSubscription) => {
    const now = new Date();
    const trialEnd = new Date(sub.trial_end_date);
    const timeDiff = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    setIsTrialActive(daysLeft > 0 && sub.subscription_type === 'trial');
    setDaysRemaining(Math.max(0, daysLeft));
  };

  const submitPremiumRequest = async (requestData: PremiumAccessRequest) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const { error } = await supabase
        .from('premium_access_requests' as any)
        .insert({
          user_id: user.id,
          full_name: requestData.full_name,
          email: requestData.email,
          phone_number: requestData.phone_number,
          message: requestData.message || null,
          status: 'pending'
        } as any);

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Hemos recibido tu solicitud. Te contactaremos pronto.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting premium request:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    subscription,
    loading,
    isTrialActive,
    daysRemaining,
    submitPremiumRequest,
    refetchSubscription: fetchSubscription
  };
};