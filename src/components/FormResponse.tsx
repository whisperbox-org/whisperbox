import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Lock, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormType } from '@/types/form';
import { walletService } from '@/lib/wallet';
import { loadResponse, submitAndPersistResponse, toHexString } from '@/lib/formStore';
import { randomBytes } from 'ethers';
import { useWakuContext } from '@/hooks/useWakuHooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FormResponseProps {
  form: FormType;
  onSubmitted?: () => void;
}

const FormResponse: React.FC<FormResponseProps> = ({ form, onSubmitted }) => {
  const { toast } = useToast();
  const { client, connected } = useWakuContext()
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (form) {
      const response = loadResponse(form.id)
      if (response) {
        setSubmitted(true)
      }
    }
  },[form])

  const handleInputChange = (questionId: string, value: string | string[]) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
    
    // Clear validation error when the user starts typing
    if (validationErrors[questionId]) {
      const newErrors = { ...validationErrors };
      delete newErrors[questionId];
      setValidationErrors(newErrors);
    }
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentValues = (answers[questionId] as string[]) || [];
    
    let newValues;
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }
    
    handleInputChange(questionId, newValues);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    form.questions.forEach(question => {
      if (question.required) {
        const answer = answers[question.id];
        
        if (!answer) {
          errors[question.id] = 'This question is required';
        } else if (Array.isArray(answer) && answer.length === 0) {
          errors[question.id] = 'Please select at least one option';
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please answer all required questions",
        variant: "destructive",
      });
      return;
    }
    
    // Always require wallet connection for all forms
    const walletAddress = walletService.getConnectedWallet();
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to submit this form",
        variant: "destructive",
      });
      return;
    }

    if (!client || !connected) {
      toast({
        title: "Waku Client not connected",
        description: "Please try again or reload the page",
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setShowConfirmDialog(false);
      
      const walletAddress = walletService.getConnectedWallet();
      if (!walletAddress) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to submit this form",
          variant: "destructive",
        });
        return;
      }

      if (!client || !connected) {
        toast({
          title: "Waku Client not connected",
          description: "Please try again or reload the page",
          variant: "destructive",
        });
        return;
      }
      
      // Create formatted answers array
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      const now = Date.now()
      let signature = ""
      
      // For non-public forms, sign message for authentication
      if (form.whitelist.type !== 'none') {
        signature = await walletService.signMessage(walletService.formatMessageToSign(form.id, walletAddress, now));
      }
      
      // Submit the response with the wallet address
      const response = await submitAndPersistResponse({
        formId: form.id,
        respondent: walletAddress,
        answers: formattedAnswers,
        submittedAt: now,
        signature: signature,
        confirmationId: toHexString(randomBytes(32)),
      });
      
      // Simulate encryption and network delay
      if (!await client.publishResponse(response)) {
        throw new Error("Failed to publish response");
      }
      
      toast({
        title: "Response submitted",
        description: "Your response has been encrypted and submitted successfully!",
      });
      
      setSubmitted(true);
      
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      
      toast({
        title: "Submission failed",
        description: "There was an error submitting your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-10"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          {form.whitelist.type === 'none' ? (
            <Check className="w-8 h-8 text-primary" />
          ) : (
            <Lock className="w-8 h-8 text-primary" />
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">Response Submitted</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {form.whitelist.type === 'none' 
            ? "Your response has been successfully submitted. Thank you for your participation!"
            : "Your response has been encrypted and securely submitted. Only the form creator will be able to decrypt and view your responses."
          }
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="bg-secondary/30 rounded-lg p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm">
              {form.whitelist.type === 'none' 
                ? "This is a public form. While wallet connection is required, no additional verification will be performed."
                : "All responses are end-to-end encrypted and can only be viewed by the form creator. Your data will not be stored on any centralized server."
              }
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          {form.questions.map((question) => (
            <motion.div 
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-5 rounded-xl border border-border bg-background shadow-sm hover:shadow transition-shadow"
            >
              <div className="mb-3 flex items-start">
                <div className="flex-1">
                  <label className="block text-base font-medium">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              </div>
              
              {question.type === 'text' && (
                <input
                  type="text"
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      toast({
                        title: "Single line only",
                        description: "Short text fields support only one line of text.",
                        variant: "default",
                      });
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-lg border bg-background form-input-focus
                    ${validationErrors[question.id] ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border'}`}
                  placeholder="Your answer"
                />
              )}
              
              {question.type === 'textarea' && (
                <textarea
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border bg-background form-input-focus min-h-[100px] resize-y
                    ${validationErrors[question.id] ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border'}`}
                  placeholder="Your answer"
                />
              )}
              
              {question.type === 'multipleChoice' && (
                <div className="space-y-3 ml-2 mt-2">
                  {question.options?.map((option, optionIndex) => (
                    <label key={`${question.id}-option-${optionIndex}`} className="flex items-center p-2 hover:bg-secondary/30 rounded-md transition-colors cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={(answers[question.id] as string) === option}
                          onChange={() => handleInputChange(question.id, option)}
                          className="w-4 h-4 border-2 border-border cursor-pointer"
                        />
                        <span className="ml-3">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'checkbox' && (
                <div className="space-y-3 ml-2 mt-2">
                  {question.options?.map((option, optionIndex) => (
                    <label key={`${question.id}-option-${optionIndex}`} className="flex items-center p-2 hover:bg-secondary/30 rounded-md transition-colors cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          value={option}
                          checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)}
                          onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                          className="w-4 h-4 border-2 border-border rounded cursor-pointer"
                        />
                        <span className="ml-3">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              {validationErrors[question.id] && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  {validationErrors[question.id]}
                </p>
              )}
            </motion.div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium flex items-center shadow-sm
              ${submitting ? 'opacity-80 cursor-wait' : 'button-hover'}`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {form.whitelist.type === 'none' ? 'Submitting...' : 'Encrypting & Submitting...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Response
              </>
            )}
          </button>
        </div>
      </form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your response? Your answers cannot be modified after you submit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FormResponse;
