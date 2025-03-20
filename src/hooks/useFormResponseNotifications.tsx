import { useEffect } from 'react';
import { useWakuContext } from './useWaku';
import { ClientEvents } from '@/lib/waku';
import { useToast } from './use-toast';
import { getConnectedWallet } from '@/lib/wallet';
import { FormType, FormSubmissionParams } from '@/types/form';

interface ResponseNotification {
  form: FormType;
  response: FormSubmissionParams;
}

/**
 * Hook to listen for new form responses and show toast notifications
 * Only shows notifications for forms created by the current user
 */
export const useFormResponseNotifications = () => {
  const { client } = useWakuContext();
  const { toast } = useToast();
  const walletAddress = getConnectedWallet();

  useEffect(() => {
    if (!client || !walletAddress) return;

    // Handler for new form response notifications
    const handleNewResponse = ({ form, response }: ResponseNotification) => {
      // Only show notification if the current user is the form creator
      if (form.creator.toLowerCase() === walletAddress.toLowerCase()) {
        // Format respondent address for display
        const respondentDisplay = 
          `${response.respondent.substring(0, 6)}...${response.respondent.substring(response.respondent.length - 4)}`;
        
        // Show toast notification with more details
        toast({
          title: "New Form Response",
          description: `${respondentDisplay} submitted a response to your form: "${form.title}"`,
          variant: "default",
        });
      }
    };

    // Listen for new response events
    client.on(ClientEvents.NEW_RESPONSE, handleNewResponse);

    // Clean up listener on unmount
    return () => {
      client.off(ClientEvents.NEW_RESPONSE, handleNewResponse);
    };
  }, [client, toast, walletAddress]);
}; 