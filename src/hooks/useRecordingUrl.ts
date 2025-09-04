import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useRecordingUrl = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRecordingUrl = async (sessionId: string, recordingUrl: string): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('session_analytics')
        .update({ recording_url: recordingUrl })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error updating recording URL:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating recording URL:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateRecordingUrl,
    isUpdating,
  };
};