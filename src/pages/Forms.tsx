import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, FileQuestion, Loader, Lock, ClipboardCheck, Inbox, EyeOff, PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import FormCard from '@/components/FormCard';
import { FormType, StoredFormType } from '@/types/form';
import { walletService } from '@/lib/wallet';
import AnimatedTransition from '@/components/AnimatedTransition';
import { getAllForms, getFormsByCreator, getStoredForms} from '@/lib/formStore';
import { useWakuContext } from '@/hooks/useWakuHooks';
import { ClientEvents } from '@/lib/waku';
import { getAllPublicForms } from '@/lib/publicFormFeed';

// Define tab types for better type safety
type TabType = 'created' | 'accessible' | 'participated' | 'viewed';

const Forms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [createdForms, setCreatedForms] = useState<FormType[]>([]);
  const [viewedForms, setViewedForms] = useState<FormType[]>([]);
  const [participatedForms, setParticipatedForms] = useState<FormType[]>([])
  const [accessibleForms, setAccesibleForms] = useState<FormType[]>([])
  const [publicForms, setPublicForms] = useState<FormType[]>([]);


  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const {client, connected} = useWakuContext()

  const [enablePublicFormsFeed, setEnablePublicFormsFeed] = useState(false)

  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      if (!connected || !client) return;
      
      const wallet = walletService.getConnectedWallet();
      if (wallet) {
        setWalletConnected(true);
        
        // Get the user's forms
        const userForms = getFormsByCreator(wallet);
        setCreatedForms(userForms);
      } else {
        setWalletConnected(false);
      }

      const storedForms = getStoredForms()
      const viewedFormsFitler = storedForms.filter(f => f.type == StoredFormType.VIEWED)
      const participatedFormsFilter = storedForms.filter(f => f.type == StoredFormType.PARTICIPATED)
      const accessibleFormsFilter = storedForms.filter(f => f.type == StoredFormType.ACCESSIBLE)
      const allForms = getAllForms()

      setViewedForms(allForms.filter(f => viewedFormsFitler.findIndex(vf => vf.id == f.id) >= 0))
      setParticipatedForms(allForms.filter(f => participatedFormsFilter.findIndex(vf => vf.id == f.id) >= 0))
      setAccesibleForms(allForms.filter(f => accessibleFormsFilter.findIndex(vf => vf.id == f.id) >= 0))

      
      setLoading(false);
    };
    
    loadForms();

    if (client)
      client.on(ClientEvents.NEW_FORM, loadForms)

    // Add event listener for wallet changes
    window.addEventListener('wallet_changed', loadForms);
    window.addEventListener('wallet_disconnected', loadForms);

    return () => {
      window.removeEventListener('wallet_changed', loadForms);
      window.removeEventListener('wallet_disconnected', loadForms);
    };
  }, [connected, client]);

  useEffect(() => {
    if (!connected || !enablePublicFormsFeed || !client) return

    const loadPublicForms = () => {
      const publicForms = getAllPublicForms()

      setPublicForms(publicForms.sort((a, b) => b.createdAt - a.createdAt))
    }

    loadPublicForms()
    if (client)
      client.on(ClientEvents.NEW_PUBLIC_FORM, loadPublicForms)
  }, [enablePublicFormsFeed, client, connected])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <Loader className="w-10 h-10 text-primary/60 mx-auto animate-spin" />
            <h2 className="mt-4 text-xl font-medium">Loading your forms...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  if (!walletConnected) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center">
            <Lock className="w-12 h-12 text-primary/60 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold">Connect Your Wallet</h2>
            <p className="mt-2 text-muted-foreground">
              You need to connect your wallet to view and manage your forms.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Tab information with icons and counts
  const tabs = [
    { 
      id: 'created', 
      label: 'Created',
      icon: <PenLine className="w-4 h-4 mr-2" />,
      count: createdForms.length 
    },
    { 
      id: 'accessible', 
      label: 'New',
      icon: <Inbox className="w-4 h-4 mr-2" />,
      count: accessibleForms.length 
    },
    { 
      id: 'participated', 
      label: 'Participated',
      icon: <ClipboardCheck className="w-4 h-4 mr-2" />,
      count: participatedForms.length 
    },
    { 
      id: 'viewed', 
      label: 'Viewed',
      icon: <EyeOff className="w-4 h-4 mr-2" />,
      count: viewedForms.length 
    }
  ];

  // Function to render the active tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case 'created':
        return (
          <>
            {createdForms.length === 0 ? (
              <div className="glassmorphism rounded-xl p-8 text-center max-w-2xl mx-auto mt-8">
                <FileQuestion className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Forms Created Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't created any secure forms yet. Create your first form to get started.
                </p>
                <Link to="/create">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-sm flex items-center mx-auto"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Create Your First Form
                  </motion.button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {createdForms.map((form, index) => (
                  <FormCard key={form.id} form={form} delay={index} />
                ))}
              </div>
            )}
          </>
        );
      case 'accessible':
        return (
          <>
            {accessibleForms.length === 0 ? (
              <div className="glassmorphism rounded-xl p-8 text-center max-w-2xl mx-auto mt-8">
                <FileQuestion className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No New Forms Available</h3>
                <p className="text-muted-foreground">
                  You don't have any new forms to participate in at the moment. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {accessibleForms.map((form, index) => (
                  <FormCard key={form.id} form={form} delay={index} />
                ))}
              </div>
            )}
          </>
        );
      case 'participated':
        return (
          <>
            {participatedForms.length === 0 ? (
              <div className="glassmorphism rounded-xl p-8 text-center max-w-2xl mx-auto mt-8">
                <FileQuestion className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Participation Yet</h3>
                <p className="text-muted-foreground">
                  You haven't participated in any forms yet. When you submit responses to forms, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {participatedForms.map((form, index) => (
                  <FormCard key={form.id} form={form} delay={index} />
                ))}
              </div>
            )}
          </>
        );
      case 'viewed':
        return (
          <>
            {viewedForms.length === 0 ? (
              <div className="glassmorphism rounded-xl p-8 text-center max-w-2xl mx-auto mt-8">
                <FileQuestion className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Viewed Forms</h3>
                <p className="text-muted-foreground">
                  You haven't viewed any forms yet. When you view forms without submitting responses, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {viewedForms.map((form, index) => (
                  <FormCard key={form.id} form={form} delay={index} />
                ))}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  // Function to get description for the active tab
  const getActiveTabDescription = () => {
    switch(activeTab) {
      case 'created':
        return "Forms you've created and manage";
      case 'accessible':
        return "New forms shared with you that need your response";
      case 'participated':
        return "Forms you've already submitted responses to";
      case 'viewed':
        return "Forms you've viewed but haven't submitted responses to";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <AnimatedTransition>
              <div>
                <h1 className="text-3xl font-bold">Your Forms</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and participate in secure, decentralized forms
                </p>
              </div>
            </AnimatedTransition>
            
            <AnimatedTransition delay={0.2}>
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 md:mt-0 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-sm flex items-center font-medium"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create New Form
                </motion.button>
              </Link>
            </AnimatedTransition>
          </div>
          
          {/* Tab navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">{getActiveTabDescription()}</p>
          </div>
          
          {/* Tab content */}
          <AnimatedTransition>
            {renderTabContent()}
          </AnimatedTransition>
        </div>
      </div>
    </Layout>
  );
};

export default Forms;
