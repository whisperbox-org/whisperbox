import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, FileQuestion, Loader, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import FormCard from '@/components/FormCard';
import { FormType, StoredFormType } from '@/types/form';
import { getConnectedWallet } from '@/lib/wallet';
import AnimatedTransition from '@/components/AnimatedTransition';
import { getAllForms, getFormsByCreator, getStoredForms, loadStoredForm } from '@/lib/formStore';
import { useWakuContext } from '@/hooks/useWaku';
import { ClientEvents } from '@/lib/waku';

const Forms: React.FC = () => {
  const [createdForms, setCreatedForms] = useState<FormType[]>([]);
  const [viewedForms, setViewedForms] = useState<FormType[]>([]);
  const [participatedForms, setParticipatedForms] = useState<FormType[]>([])
  const [accessibleForms, setAccesibleForms] = useState<FormType[]>([])

  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const {client, connected} = useWakuContext()

  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      if (!connected || !client) return;
      
      const wallet = getConnectedWallet();
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

  return (
    <Layout>
      <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <AnimatedTransition>
              <div>
                <h1 className="text-3xl font-bold">Your Forms</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your secure, decentralized forms and surveys
                </p>
              </div>
            </AnimatedTransition>
            
            <AnimatedTransition delay={0.2}>
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-lg shadow-sm flex items-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create New Form
                </motion.button>
              </Link>
            </AnimatedTransition>
          </div>

          {createdForms.length === 0 ? (
            <div className="glassmorphism rounded-xl p-12 text-center max-w-2xl mx-auto">
              <FileQuestion className="w-16 h-16 text-muted-foreground/40 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">No Forms Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't created any secure forms yet. Create your first form to get started.
              </p>
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-primary text-white rounded-lg shadow-sm flex items-center mx-auto"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Your First Form
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdForms.map((form, index) => (
                <FormCard key={form.id} form={form} delay={index} />
              ))}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 mt-12">
            <AnimatedTransition>
              <div>
                <h1 className="text-3xl font-bold">New forms for you to participate in</h1>
              </div>
            </AnimatedTransition>
          </div>
          {accessibleForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessibleForms.map((form, index) => (
                <FormCard key={form.id} form={form} delay={index} />
              ))}
            </div>
          ): (
            <div>You have accessible forms yet</div>
          )}
        
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 mt-12">
            <AnimatedTransition>
              <div>
                <h1 className="text-3xl font-bold">Forms you participated in</h1>
              </div>
            </AnimatedTransition>
          </div>
          {participatedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participatedForms.map((form, index) => (
                <FormCard key={form.id} form={form} delay={index} />
              ))}
            </div>
          ): (
            <div>You have not participated in any form yet</div>
          )}
        
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 mt-12">
            <AnimatedTransition>
              <div>
                <h1 className="text-3xl font-bold">Forms you have access to or viewed</h1>
              </div>
            </AnimatedTransition>
          </div>
          {viewedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewedForms.map((form, index) => (
                <FormCard key={form.id} form={form} delay={index} />
              ))}
            </div>
          ): (
            <div>You have not viewed any form yet</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Forms;
