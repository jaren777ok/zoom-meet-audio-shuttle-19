import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type: 'trial' | 'premium' | 'expired';
  trial_start_date: string;
  trial_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface PremiumAccessRequest {
  id?: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (subscription) {
      calculateDaysRemaining();
    }
  }, [subscription]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data as UserSubscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!subscription) return;

    const now = new Date();
    const endDate = new Date(subscription.trial_end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysRemaining(Math.max(0, diffDays));
    setIsTrialExpired(diffDays <= 0 && subscription.subscription_type === 'trial');

    // Auto-update subscription status if trial expired
    if (diffDays <= 0 && subscription.subscription_type === 'trial') {
      updateSubscriptionStatus('expired');
    }
  };

  const updateSubscriptionStatus = async (newStatus: 'trial' | 'premium' | 'expired') => {
    if (!subscription || !user) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          subscription_type: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating subscription:', error);
        return;
      }

      setSubscription(prev => prev ? { ...prev, subscription_type: newStatus } : null);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const submitPremiumRequest = async (requestData: PremiumAccessRequest) => {
    try {
      const { error } = await supabase
        .from('premium_access_requests')
        .insert([{
          user_id: requestData.user_id,
          email: requestData.email,
          full_name: requestData.full_name,
          phone_number: requestData.phone_number,
          message: requestData.message || ''
        }]);

      if (error) {
        console.error('Error submitting premium request:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud ha sido enviada correctamente. Te contactaremos pronto.",
      });

      return true;
    } catch (error) {
      console.error('Error submitting premium request:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    }
  };

  const canUseFeatures = () => {
    return subscription?.subscription_type === 'premium' || !isTrialExpired;
  };

  return {
    subscription,
    loading,
    daysRemaining,
    isTrialExpired,
    canUseFeatures: canUseFeatures(),
    submitPremiumRequest,
    refreshSubscription: fetchSubscription
  };
};