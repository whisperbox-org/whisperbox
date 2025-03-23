import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Minus, Trash2, Save, HelpCircle, AlignLeft, CheckSquare, ListChecks, FileText, Globe, Shield, Users, Copy, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormQuestion } from '@/types/form';
import { walletService } from '@/lib/wallet';
import { useNavigate } from 'react-router-dom';
import { createForm } from '@/lib/formStore';
import { FORM_CONFIG } from '@/config/form';
import { useWakuContext } from '@/hooks/useWakuHooks';

const FormCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: `q-${Date.now()}`,
      ...FORM_CONFIG.DEFAULT_QUESTION,
      text: '',
    },
  ]);
  const [whitelistType, setWhitelistType] = useState<'nft' | 'addresses' | 'none'>(FORM_CONFIG.WHITELIST_TYPES.NONE);
  const [whitelistValue, setWhitelistValue] = useState(''); // Empty by default since Public Access is selected
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const {client,connected} = useWakuContext()

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length}`,
        ...FORM_CONFIG.DEFAULT_QUESTION,
        text: '',
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof FormQuestion, value: string | boolean | string[]) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    
    // If changing type to text or textarea, remove options
    if (field === 'type' && (value === FORM_CONFIG.QUESTION_TYPES.TEXT || value === FORM_CONFIG.QUESTION_TYPES.TEXTAREA)) {
      updatedQuestions[index].options = [];
    }
    
    // If changing type to multipleChoice or checkbox and no options exist, add some defaults
    if (field === 'type' && (value === FORM_CONFIG.QUESTION_TYPES.RADIO_BUTTONS || value === FORM_CONFIG.QUESTION_TYPES.CHECKBOX) && (!updatedQuestions[index].options || updatedQuestions[index].options!.length === 0)) {
      updatedQuestions[index].options = ['', ''];
    }
    
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const currentOptions = updatedQuestions[questionIndex].options || [];
    updatedQuestions[questionIndex].options = [
      ...currentOptions,
      ``,
    ];
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter(
      (_, index) => index !== optionIndex
    );
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one question in your form.",
        variant: "destructive",
      });
      return;
    }
    
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !connected) {
      toast({title: "Waku client not initialized"})
      return
    }
    
    const walletAddress = walletService.getConnectedWallet();
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a form.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please add a title for your form.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast({
          title: "Empty question",
          description: `Question ${i + 1} is empty. Please add text or remove it.`,
          variant: "destructive",
        });
        return;
      }
      
      // Check if options exist and have at least 2 items for choice-based questions
      if ((questions[i].type === FORM_CONFIG.QUESTION_TYPES.RADIO_BUTTONS || questions[i].type === FORM_CONFIG.QUESTION_TYPES.CHECKBOX)) {
        const options = questions[i].options;
        if (!options || options.length < 2) {
          toast({
            title: "Not enough options",
            description: `Question ${i + 1} needs at least 2 options.`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    // Validate whitelist value for NFT and address types
    if (whitelistType === FORM_CONFIG.WHITELIST_TYPES.NFT && !whitelistValue.trim()) {
      toast({
        title: "Missing NFT contract",
        description: "Please enter an NFT contract address.",
        variant: "destructive",
      });
      return;
    }
    
    if (whitelistType === FORM_CONFIG.WHITELIST_TYPES.ADDRESSES && !whitelistValue.trim()) {
      toast({
        title: "Missing addresses",
        description: "Please enter at least one wallet address.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Create form with potentially empty whitelist value for 'none' type
      const whitelistValueToUse = whitelistType === FORM_CONFIG.WHITELIST_TYPES.NONE ? '' : whitelistValue;
      
      // Generate a timestamp for the form creation
      const timestamp = Date.now();
      
      // Create a signature to verify the form creator
      let signature;
      try {
        const messageToSign = walletService.formatFormCreationMessage(title, walletAddress, timestamp);
        signature = await walletService.signMessage(messageToSign);
      } catch (error) {
        toast({
          title: "Signature Error",
          description: "Failed to sign form creation. You must approve the signature request.",
          variant: "destructive",
        });
        return;
      }
      
      // Create form with signature
      try {
        const newForm = createForm({
          title,
          description,
          createdAt: timestamp,
          creator: walletAddress,
          questions,
          whitelist: {
            type: whitelistType,
            value: whitelistValueToUse,
          },
          signature,
        });
        
        // Publish the form to the Waku network
        const result = await client.publishForm(newForm)
        if (!result) {
          throw new Error("Failed to publish new form")
        }
        
        // Generate the shareable link
        const formLink = `${window.location.origin}/view/${newForm.id}`;
        
        // Show success toast with copy button
        toast({
          title: "Form created",
          description: (
            <div className="flex flex-col space-y-2">
              <p>Your form has been created successfully!</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formLink);
                  toast({
                    title: "Link copied",
                    description: "Form link copied to clipboard",
                  });
                }}
                className="flex items-center mt-2 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy Form Link
              </button>
            </div>
          ),
          duration: 5000, // Show longer to give time to copy
        });
        
        navigate(`/view/${newForm.id}`);
      } catch (error) {
        // Handle specific signature validation errors
        if (error instanceof Error && error.message.includes("signature")) {
          toast({
            title: "Signature Validation Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          throw error; // Re-throw other errors to be caught by the outer catch
        }
      }
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: "There was an error creating your form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case FORM_CONFIG.QUESTION_TYPES.TEXT:
        return <FileText className="w-4 h-4" />;
      case FORM_CONFIG.QUESTION_TYPES.TEXTAREA:
        return <AlignLeft className="w-4 h-4" />;
      case FORM_CONFIG.QUESTION_TYPES.RADIO_BUTTONS:
        return <ListChecks className="w-4 h-4" />;
      case FORM_CONFIG.QUESTION_TYPES.CHECKBOX:
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Handler for reordering questions
  const handleReorder = (reorderedQuestions: FormQuestion[]) => {
    setQuestions(reorderedQuestions);
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create New Form</h1>
          <p className="text-muted-foreground mt-1">
            Design your form and set access permissions
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
      
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-lg bg-secondary/80 text-sm"
          >
            <h3 className="font-medium mb-2">How to create a form:</h3>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Provide a descriptive title and optional description</li>
              <li>Add your questions (text, paragraph, multiple choice, or checkboxes)</li>
              <li>Set access permissions:
                <ul className="list-disc ml-6 mt-1 space-y-1 text-xs">
                  <li><strong>Public Access</strong> (Default) - Any connected wallet can access (no NFT/address verification)</li>
                  <li><strong>NFT Ownership</strong> - Only wallets that own specific NFTs can access</li>
                  <li><strong>Specific Addresses</strong> - Only whitelisted wallet addresses can access</li>
                </ul>
              </li>
              <li>Save your form to generate a unique link</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              For NFT and address-restricted forms, responses are end-to-end encrypted and accessible only to you.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Form Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background form-input-focus"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief description of your form"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background form-input-focus min-h-[100px]"
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Questions</h2>
            <p className="text-xs text-muted-foreground">Drag questions to reorder</p>
          </div>
          
          <Reorder.Group axis="y" values={questions} onReorder={handleReorder} className="space-y-6">
            {questions.map((question, index) => {
              return (
                <Reorder.Item
                  key={question.id}
                  value={question}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-5 rounded-xl border border-border bg-background"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center cursor-grab active:cursor-grabbing mr-2">
                        <GripVertical className="w-5 h-5 text-muted-foreground hover:text-primary" />
                      </div>
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-medium mr-3">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getQuestionIcon(question.type)}
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                            className="text-sm bg-secondary/50 border-0 rounded-md px-2 py-1"
                          >
                            <option value={FORM_CONFIG.QUESTION_TYPES.TEXT}>Short Text</option>
                            <option value={FORM_CONFIG.QUESTION_TYPES.TEXTAREA}>Paragraph</option>
                            <option value={FORM_CONFIG.QUESTION_TYPES.RADIO_BUTTONS}>Multiple Choice</option>
                            <option value={FORM_CONFIG.QUESTION_TYPES.CHECKBOX}>Checkboxes</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      placeholder="Question text"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-transparent form-input-focus"
                      required
                    />
                  </div>
                  
                  {(question.type === FORM_CONFIG.QUESTION_TYPES.RADIO_BUTTONS || question.type === FORM_CONFIG.QUESTION_TYPES.CHECKBOX) && (
                    <div className="space-y-2 ml-2">
                      {question.options?.map((option, optionIndex) => (
                        <div key={`${question.id}-option-${optionIndex}`} className="flex items-center">
                          <div className="w-5 mr-2 flex justify-center">
                            {question.type === FORM_CONFIG.QUESTION_TYPES.RADIO_BUTTONS ? (
                              <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-sm border border-muted-foreground/40 inline-block" />
                            )}
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1 px-2 py-1 text-sm rounded border border-border bg-transparent form-input-focus"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index, optionIndex)}
                            className="p-1 ml-1 text-muted-foreground hover:text-destructive transition-colors"
                            disabled={question.options!.length <= 2}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="flex items-center mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Option
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center">
                    <label className="flex items-center text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                        className="mr-2 rounded"
                      />
                      Required question
                    </label>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>
        <div className='flex justify-end'>
        <button
              type="button"
              onClick={addQuestion}
              className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </button>
        </div>
        
        <div className="p-5 rounded-xl border border-border bg-background">
          <h2 className="text-lg font-semibold mb-4">Access Control</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="whitelistType"
                  checked={whitelistType === FORM_CONFIG.WHITELIST_TYPES.NONE}
                  onChange={() => setWhitelistType(FORM_CONFIG.WHITELIST_TYPES.NONE)}
                  className="mr-2"
                />
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-1.5 text-primary" />
                  Public Access
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="whitelistType"
                  checked={whitelistType === FORM_CONFIG.WHITELIST_TYPES.NFT}
                  onChange={() => setWhitelistType(FORM_CONFIG.WHITELIST_TYPES.NFT)}
                  className="mr-2"
                />
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1.5 text-primary" />
                  NFT Ownership
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="whitelistType"
                  checked={whitelistType === FORM_CONFIG.WHITELIST_TYPES.ADDRESSES}
                  onChange={() => setWhitelistType(FORM_CONFIG.WHITELIST_TYPES.ADDRESSES)}
                  className="mr-2"
                />
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-primary" />
                  Specific Addresses
                </div>
              </label>
            </div>
            
            {whitelistType === FORM_CONFIG.WHITELIST_TYPES.NFT ? (
              <div>
                <label htmlFor="nftContract" className="block text-sm font-medium mb-1">
                  NFT Contract Address
                </label>
                <input
                  type="text"
                  id="nftContract"
                  value={whitelistValue}
                  onChange={(e) => setWhitelistValue(e.target.value)}
                  placeholder="Enter NFT contract address (e.g. 0x123...)"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background form-input-focus"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only wallets that own an NFT from this contract will be able to access and submit the form.
                </p>
              </div>
            ) : whitelistType === FORM_CONFIG.WHITELIST_TYPES.ADDRESSES ? (
              <div>
                <label htmlFor="addresses" className="block text-sm font-medium mb-1">
                  Whitelisted Addresses
                </label>
                <textarea
                  id="addresses"
                  value={whitelistValue}
                  onChange={(e) => setWhitelistValue(e.target.value)}
                  placeholder="0x1234..., 0x5678..., 0xabcd..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background form-input-focus min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter comma-separated wallet addresses that should have access to this form.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/10">
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Public Access Selected (Default)</h3>
                    <p className="text-sm text-muted-foreground">
                      Anyone with a connected wallet will be able to access this form.
                      No NFT ownership or address verification will be performed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium flex items-center 
              ${saving ? 'opacity-80 cursor-wait' : 'button-hover'}`}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Form...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Form
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormCreator;
