
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Save, HelpCircle, AlignLeft, CheckSquare, ListChecks, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createForm, FormQuestion } from '@/lib/formStore';
import { getConnectedWallet } from '@/lib/walletUtils';
import { useNavigate } from 'react-router-dom';

const FormCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: `q-${Date.now()}`,
      type: 'text',
      text: '',
      required: true,
      options: [],
    },
  ]);
  const [whitelistType, setWhitelistType] = useState<'nft' | 'addresses'>('nft');
  const [whitelistValue, setWhitelistValue] = useState('0x1234567890123456789012345678901234567890'); // Default NFT contract
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}-${questions.length}`,
        type: 'text',
        text: '',
        required: true,
        options: [],
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof FormQuestion, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    
    // If changing type to text or textarea, remove options
    if (field === 'type' && (value === 'text' || value === 'textarea')) {
      updatedQuestions[index].options = [];
    }
    
    // If changing type to multipleChoice or checkbox and no options exist, add some defaults
    if (field === 'type' && (value === 'multipleChoice' || value === 'checkbox') && (!updatedQuestions[index].options || updatedQuestions[index].options!.length === 0)) {
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
    
    const walletAddress = getConnectedWallet();
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
      
      if ((questions[i].type === 'multipleChoice' || questions[i].type === 'checkbox') && 
          (!questions[i].options || questions[i].options.length < 2)) {
        toast({
          title: "Not enough options",
          description: `Question ${i + 1} needs at least 2 options.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      setSaving(true);
      
      // Create form
      const newForm = createForm({
        title,
        description,
        creator: walletAddress,
        questions,
        whitelist: {
          type: whitelistType,
          value: whitelistValue,
        },
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Form created",
        description: "Your form has been created successfully!",
      });
      
      navigate(`/view/${newForm.id}`);
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
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'textarea':
        return <AlignLeft className="w-4 h-4" />;
      case 'multipleChoice':
        return <ListChecks className="w-4 h-4" />;
      case 'checkbox':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
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
              <li>Set access permissions (NFT ownership or specific addresses)</li>
              <li>Save your form to generate a unique, encrypted link</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              All responses will be end-to-end encrypted and accessible only to you.
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
          </div>
          
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-5 rounded-xl border border-border bg-background"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
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
                        <option value="text">Short Text</option>
                        <option value="textarea">Paragraph</option>
                        <option value="multipleChoice">Multiple Choice</option>
                        <option value="checkbox">Checkboxes</option>
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
              
              {(question.type === 'multipleChoice' || question.type === 'checkbox') && (
                <div className="space-y-2 ml-2">
                  {question.options?.map((option, optionIndex) => (
                    <div key={`${question.id}-option-${optionIndex}`} className="flex items-center">
                      <div className="w-5 mr-2 flex justify-center">
                        {question.type === 'multipleChoice' ? (
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
            </motion.div>
          ))}
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
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="whitelistType"
                  checked={whitelistType === 'nft'}
                  onChange={() => setWhitelistType('nft')}
                  className="mr-2"
                />
                NFT Ownership
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="whitelistType"
                  checked={whitelistType === 'addresses'}
                  onChange={() => setWhitelistType('addresses')}
                  className="mr-2"
                />
                Specific Addresses
              </label>
            </div>
            
            {whitelistType === 'nft' ? (
              <div>
                <label htmlFor="nftContract" className="block text-sm font-medium mb-1">
                  NFT Contract Address
                </label>
                <input
                  type="text"
                  id="nftContract"
                  value={whitelistValue}
                  onChange={(e) => setWhitelistValue(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background form-input-focus"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only wallets that own an NFT from this contract will be able to access and submit the form.
                </p>
              </div>
            ) : (
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
