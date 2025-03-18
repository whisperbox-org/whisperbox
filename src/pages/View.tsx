
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Clock, User, ClipboardList, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import FormResponse from '@/components/FormResponse';
import NFTGate from '@/components/NFTGate';
import { 
  FormType, 
  getFormById, 
  canAccessForm, 
  hasResponded 
} from '@/lib/formStore';
import { getConnectedWallet } from '@/lib/walletUtils';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useToast } from '@/hooks/use-toast';

const View: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAlreadyResponded, setHasAlreadyResponded] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      setLoading(true);
      
      if (!id) {
        navigate('/forms');
        return;
      }
      
      const foundForm = getFormById(id);
      if (!foundForm) {
        toast({
          title: "Form not found",
          description: "The form you're looking for doesn't exist",
          variant: "destructive",
        });
        navigate('/forms');
        return;
      }
      
      setForm(foundForm);
      setFormUrl(`${window.location.origin}/view/${id}`);
      
      const wallet = getConnectedWallet();
      if (wallet) {
        // Check if the current user is the creator
        const creator = foundForm.creator.toLowerCase() === wallet.toLowerCase();
        setIsCreator(creator);
        
        if (creator) {
          setHasAccess(true);
        } else {
          // Check if user has access to the form
          const access = await canAccessForm(id, wallet);
          setHasAccess(access);
          
          // Check if user has already responded
          const responded = hasResponded(id, wallet);
          setHasAlreadyResponded(responded);
        }
      }
      
      setLoading(false);
    };
    
    loadForm();
  }, [id, navigate, toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    
    toast({
      title: "Link copied",
      description: "Form link copied to clipboard",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="h-8 bg-secondary rounded w-1/3 animate-pulse"></div>
            <div className="h-12 bg-secondary rounded w-2/3 mt-4 animate-pulse"></div>
            <div className="h-6 bg-secondary rounded w-full mt-6 animate-pulse"></div>
            
            <div className="mt-10">
              <div className="h-32 bg-secondary rounded w-full animate-pulse"></div>
              <div className="h-32 bg-secondary rounded w-full mt-4 animate-pulse"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold">Form Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The form you're looking for doesn't exist or has been deleted.
            </p>
            <Link to="/forms" className="mt-6 inline-block text-primary hover:underline">
              Return to your forms
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-3xl mx-auto">
          <AnimatedTransition>
            <div className="mb-6">
              <Link to="/forms" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to forms
              </Link>
            </div>
            
            <div className="mb-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{form.title}</h1>
                  <p className="text-muted-foreground mt-1">{form.description}</p>
                </div>
                
                {isCreator && (
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center mt-4 md:mt-0 px-4 py-2 bg-secondary rounded-lg text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1.5" />
                  Created on {formatDate(form.createdAt)}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <ClipboardList className="w-4 h-4 mr-1.5" />
                  {form.questions.length} questions
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-1.5" />
                  {form.responses.length} responses
                </div>
                
                <div className="flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-1.5 text-green-500" />
                  <span className="text-green-600 font-medium">End-to-end encrypted</span>
                </div>
              </div>
            </div>
          </AnimatedTransition>
          
          {isCreator ? (
            <AnimatedTransition delay={0.2}>
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Creator Dashboard</h2>
                  <button
                    onClick={() => setShowResponses(!showResponses)}
                    className="flex items-center px-3 py-1.5 text-sm rounded-lg bg-secondary"
                  >
                    {showResponses ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1.5" />
                        Hide Responses
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1.5" />
                        View Responses
                      </>
                    )}
                  </button>
                </div>
                
                {showResponses && (
                  <div className="mt-6 space-y-4">
                    {form.responses.length === 0 ? (
                      <div className="text-center p-8 border border-border rounded-lg">
                        <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1">No responses yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Responses will appear here when participants complete your form.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {form.responses.map((response, index) => (
                          <div 
                            key={response.id} 
                            className="p-4 rounded-lg border border-border hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                                  {index + 1}
                                </span>
                                <div className="ml-3">
                                  <div className="font-medium">Anonymous Respondent</div>
                                  <div className="text-xs text-muted-foreground">
                                    Submitted on {formatDate(response.submittedAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mt-4">
                              {response.answers.map((answer) => {
                                const question = form.questions.find(q => q.id === answer.questionId);
                                return (
                                  <div key={answer.questionId} className="text-sm">
                                    <div className="font-medium mb-1">{question?.text}</div>
                                    <div className="px-3 py-2 bg-secondary/50 rounded-md">
                                      {Array.isArray(answer.value) ? (
                                        <ul className="list-disc list-inside">
                                          {answer.value.map((item, i) => (
                                            <li key={i}>{item}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        answer.value
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AnimatedTransition>
          ) : (
            <AnimatedTransition delay={0.1}>
              {form.whitelist.type === 'nft' ? (
                <NFTGate contractAddress={form.whitelist.value}>
                  {hasAccess && (
                    <>
                      {hasAlreadyResponded ? (
                        <div className="text-center p-8 border border-border rounded-lg">
                          <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-xl font-medium mb-2">Thank You!</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            You have already submitted a response to this form. Multiple submissions are not allowed.
                          </p>
                        </div>
                      ) : (
                        <FormResponse form={form} />
                      )}
                    </>
                  )}
                </NFTGate>
              ) : (
                <>{/* Handle address-based access control */}</>
              )}
            </AnimatedTransition>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default View;
