import { useEffect } from 'react';
import { useWakuContext } from './useWaku';
import { ClientEvents } from '@/lib/waku';
import { useToast } from './use-toast';
import { getConnectedWallet, getENS } from '@/lib/wallet';
import { FormType, FormSubmissionParams } from '@/types/form';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!client || !walletAddress) return;

    // Handler for new form response notifications
    const handleNewResponse = async ({ form, response }: ResponseNotification) => {
      // Only show notification if the current user is the form creator
      if (form.creator.toLowerCase() === walletAddress.toLowerCase()) {
        // Format respondent address for display
        const respondentDisplay = 
          `${response.respondent.substring(0, 6)}...${response.respondent.substring(response.respondent.length - 4)}`;
        const respondentEns = await getENS(response.respondent)

        const formLink = `/view/${form.id}`;

        // Show toast notification with more details
        toast({
          title: "New Form Response",
          description: (
            <div className="flex flex-col space-y-2">
              <p>{respondentEns || respondentDisplay} submitted a response to your form: <b>{form.title}</b></p>
              <button
                onClick={() => {
                  navigate(formLink);
                }}
                className="flex items-center mt-2 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium"
              >

               View Form
              </button>
            </div>
          ),
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