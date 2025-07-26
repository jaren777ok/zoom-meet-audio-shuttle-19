import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MeetingConfiguration {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

export const useMeetingConfiguration = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<MeetingConfiguration>({
    numberOfPeople: 1,
    companyInfo: '',
    meetingObjective: ''
  });

  // Load the user's last configuration on mount
  useEffect(() => {
    if (user) {
      loadConfiguration();
    }
  }, [user]);

  const loadConfiguration = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setConfig({
          numberOfPeople: data.number_of_people,
          companyInfo: data.company_info,
          meetingObjective: data.meeting_objective
        });
      }
    } catch (error) {
      console.log('No previous configuration found or error loading:', error);
      // This is expected for new users, so we don't show an error
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async (newConfig: MeetingConfiguration) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('meeting_configurations')
        .upsert({
          user_id: user.id,
          number_of_people: newConfig.numberOfPeople,
          company_info: newConfig.companyInfo,
          meeting_objective: newConfig.meetingObjective
        });

      if (error) {
        console.error('Error saving configuration:', error);
      } else {
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  return {
    config,
    setConfig,
    saveConfiguration,
    isLoading
  };
};