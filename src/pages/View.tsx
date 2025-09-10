import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Clock, User, ClipboardList, Eye, EyeOff, Copy, Check, Globe, LayoutGrid, Table, FileText, FileSpreadsheet } from 'lucide-react';
import Layout from '@/components/Layout';
import FormResponse from '@/components/FormResponse';
import NFTGate from '@/components/NFTGate';
import { 
  getFormById, 
  hasResponded, 
  canAccessFormById,
  updateStoredForm,
  loadStoredForm,
  formToCSV
} from '@/lib/formStore';
import { walletService } from '@/lib/wallet';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useToast } from '@/hooks/use-toast';
import { FormType, StoredFormType } from '@/types';
import { ClientEvents } from '@/lib/waku';
import { useWakuContext } from '@/hooks/useWakuHooks';
import { CSVDownload, CSVLink } from "react-csv";


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
  const [viewType, setViewType] = useState<'card' | 'table'>('card');
  const [formUrl, setFormUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const {client, connected} = useWakuContext()
  const [creatorENS, setCreatorENS] = useState<string | null>(null)

  useEffect(() => {
    const loadForm = async () => {
      console.log("Loading form", id, client, connected)
      setLoading(true);
      if (!client || !connected) return
      console.log("Waku client connected, proceeding")
      
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
      
      const wallet = walletService.getConnectedWallet();
      
      // If the form has no access control, grant access immediately
      if (foundForm.whitelist.type === 'none') {
        // Only grant access if wallet is connected
        if (wallet) {
          setHasAccess(true);
          
          // Check if user has already responded
          const responded = hasResponded(id, wallet);
          setHasAlreadyResponded(responded);
        } else {
          setHasAccess(false);
        }
        
        setLoading(false);
      }
      
      if (wallet) {
        // Simple and direct creator check - just normalize addresses
        const isCreator = foundForm.creator.toLowerCase() === wallet.toLowerCase();
        setIsCreator(isCreator);
        
        if (isCreator) {
          setHasAccess(true);
        } else {
          // Check if user has access to the form
          const access = await canAccessFormById(id, wallet);
          setHasAccess(access);
          
          // Check if user has already responded
          const responded = hasResponded(id, wallet);
          setHasAlreadyResponded(responded);
        }
      }

      setCreatorENS(await walletService.getENS(foundForm.creator))

      if (foundForm.id == id) {
        const storedForm = loadStoredForm(id)
        if (storedForm.type == StoredFormType.ACCESSIBLE) {
          updateStoredForm(id, StoredFormType.VIEWED)
        }
      }

      setLoading(false);
    };
    
    loadForm();

    if (client)
      client.on(ClientEvents.NEW_RESPONSE, loadForm)
  }, [id, navigate, toast, client, connected]);

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

  const formatDate = (ts: number) => {
    const date = new Date(ts);
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
                  {form.confirmations.length} responses
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-1.5" />
                  Created by { creatorENS || walletService.shortAddress(form.creator)}
                </div>
                
                {form.whitelist.type === 'none' ? (
                  <div className="flex items-center text-sm">
                    <Globe className="w-4 h-4 mr-1.5 text-blue-500" />
                    <span className="text-blue-600 font-medium">Public Access</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm">
                    <Shield className="w-4 h-4 mr-1.5 text-green-500" />
                    <span className="text-green-600 font-medium">End-to-end encrypted</span>
                  </div>
                )}
              </div>
            </div>
          </AnimatedTransition>
          
          {/* Floating share button for creators */}
          {isCreator && (
            <div className="fixed bottom-8 right-8 z-10">
              <div className="relative group">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary-hover transition-all"
                  aria-label="Copy form link"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-background border border-border px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {copied ? 'Copied!' : 'Copy form link'}
                </span>
              </div>
            </div>
          )}
          
          {isCreator ? (
            <AnimatedTransition delay={0.2}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Creator Dashboard</h2>
                  <div className="flex items-center gap-2">
                    {showResponses && form.responses.length > 0 && (
                      <div className="flex border border-border rounded-lg overflow-hidden shadow-sm">
                        <button
                          onClick={() => setViewType('card')}
                          className={`flex items-center px-3 py-1.5 text-sm font-medium transition-colors ${
                            viewType === 'card' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-background hover:bg-secondary/50'
                          }`}
                          aria-label="Card view"
                        >
                          <LayoutGrid className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Cards</span>
                        </button>
                        <button
                          onClick={() => setViewType('table')}
                          className={`flex items-center px-3 py-1.5 text-sm font-medium transition-colors ${
                            viewType === 'table' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-background hover:bg-secondary/50'
                          }`}
                          aria-label="Table view"
                        >
                          <Table className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Table</span>
                        </button>
                        <CSVLink 
                          className={`flex items-center px-3 py-1.5 text-sm font-medium transition-colors ${
                              'bg-background hover:bg-secondary/50'
                          }`}
                          data={formToCSV(form)}
                          target="_blank" 
                          aria-label="Download CSV"
                          filename={`${form.title}.csv`}
                        >                          
                          <FileSpreadsheet className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">CSV</span>
                        </CSVLink>

                      </div>
                    )}
                    <button
                      onClick={() => setShowResponses(!showResponses)}
                      className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      {showResponses ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1.5" />
                          <span className="hidden xs:inline">Hide Responses</span>
                          <span className="inline xs:hidden">Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1.5" />
                          <span className="hidden xs:inline">View Responses</span>
                          <span className="inline xs:hidden">View</span> ({form.responses.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Always show a prompt when responses exist but aren't being viewed */}
                {!showResponses && form.responses.length > 0 && (
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 mb-4">
                    <div className="flex items-center">
                      <ClipboardList className="w-5 h-5 text-primary mr-2" />
                      <p className="text-sm">
                        <span className="font-medium">You have {form.responses.length} {form.responses.length === 1 ? 'response' : 'responses'}</span>. 
                        Click the "View Responses" button above to see the submissions.
                      </p>
                    </div>
                  </div>
                )}
                
                {showResponses && (
                  <div className="mt-2 space-y-4">
                    {form.responses.length === 0 ? (
                      <div className="text-center p-8 border border-border rounded-lg bg-background/50">
                        <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1">No responses yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Responses will appear here when participants complete your form.
                        </p>
                      </div>
                    ) : viewType === 'card' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {form.responses.map((response, index) => (
                          <div 
                            key={response.id} 
                            className="p-4 rounded-lg border border-border hover:border-border/80 hover:shadow-md transition-all bg-background"
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
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    Respondent: {response.respondentENS || (response.respondent.substring(0, 6) + '...' + response.respondent.substring(response.respondent.length - 4))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mt-4">
                              {response.answers.map((answer) => {
                                const question = form.questions.find(q => q.id === answer.questionId);
                                return (
                                  <div key={answer.questionId} className="text-sm">
                                    <div className="font-medium mb-1 text-foreground/90">{question?.text}</div>
                                    <div className="px-3 py-2 bg-secondary/50 rounded-md">
                                      {Array.isArray(answer.value) ? (
                                        <ul className="list-disc list-inside">
                                          {answer.value.map((item, i) => (
                                            <li key={i} className="text-foreground/80">{question?.options && question?.options[item]}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <span className="text-foreground/80">{question?.type == 'radioButtons' && question.options? question.options[answer.value as number] : answer.value}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-background">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-secondary/70">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Respondent</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Date</th>
                                {form.questions.map(question => (
                                  <th key={question.id} className="px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                                    {question.text}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {form.responses.map((response, index) => (
                                <tr key={response.id} className="hover:bg-secondary/20 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">{index + 1}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {response.respondentENS || response.respondent.substring(0, 6) + '...' + response.respondent.substring(response.respondent.length - 4)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(response.submittedAt)}</td>
                                  {form.questions.map(question => {
                                    const answer = response.answers.find(a => a.questionId === question.id);
                                    return (
                                      <td key={question.id} className="px-4 py-3 text-sm">
                                        {answer ? (
                                          Array.isArray(answer.value) && question.options ? (
                                            <div className="max-w-xs">
                                              {answer.value.map(item => question.options![item]).join(', ')}
                                            </div>
                                          ) : (
                                            <div className="max-w-xs truncate">
                                              {question?.type == 'radioButtons' && question.options? question.options[answer.value as number] : answer.value}
                                            </div>
                                          )
                                        ) : (
                                          <span className="text-muted-foreground italic">No answer</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!showResponses && form.responses.length === 0 && (
                  <div className="mt-2 space-y-4">
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 mb-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-primary mr-2" />
                        <p className="text-sm">
                          <span className="font-medium">Form Preview</span>. 
                          Here are the questions in your form. You'll see responses here once users submit them.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {form.questions.map((question, index) => (
                        <div 
                          key={question.id} 
                          className="p-5 rounded-xl border border-border bg-background shadow-sm"
                        >
                          <div className="flex items-start mb-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-medium mr-3">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-medium text-foreground">
                                {question.text}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                              </h3>
                              <div className="text-xs text-muted-foreground mt-1">
                                {question.type === 'text' && 'Short Text Answer'}
                                {question.type === 'textarea' && 'Paragraph Answer'}
                                {question.type === 'radioButtons' && 'Multiple Choice (Single Selection)'}
                                {question.type === 'checkbox' && 'Checkboxes (Multiple Selection)'}
                              </div>
                            </div>
                          </div>
                          
                          {(question.type === 'radioButtons' || question.type === 'checkbox') && question.options && (
                            <div className="pl-10 mt-3 space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center">
                                  <div className="w-5 mr-2 flex justify-center">
                                    {question.type === 'radioButtons' ? (
                                      <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-sm border border-muted-foreground/40 inline-block" />
                                    )}
                                  </div>
                                  <span className="text-sm text-foreground/80">{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
              ) : form.whitelist.type === 'addresses' ? (
                // Handle address-based access control
                <>
                  {hasAccess ? (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-xl shadow-sm">
                      <Shield className="w-10 h-10 text-amber-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Access Restricted</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        This form is restricted to specific wallet addresses. Please connect your wallet to verify access.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                // No access control - anyone with a connected wallet can view and submit
                <div>
                  {!walletService.getConnectedWallet() ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-xl shadow-sm">
                      <Shield className="w-10 h-10 text-amber-500 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Wallet Connection Required</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Please connect your wallet to view and submit this form.
                      </p>
                    </div>
                  ) : (
                    <FormResponse form={form} />
                  )}
                </div>
              )}
            </AnimatedTransition>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default View;
