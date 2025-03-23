import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import FormCreator from '@/components/FormCreator';
import { walletService } from '@/lib/wallet';
import AnimatedTransition from '@/components/AnimatedTransition';

const Create: React.FC = () => {
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const checkWallet = () => {
      const wallet = walletService.getConnectedWallet();
      setWalletConnected(!!wallet);
    };
    
    checkWallet();
    // Check again if wallet status changes
    window.addEventListener('storage', checkWallet);
    
    return () => {
      window.removeEventListener('storage', checkWallet);
    };
  }, []);


  if (!walletConnected) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8">
          <AnimatedTransition>
            <div className="max-w-xl mx-auto text-center">
              <Lock className="w-12 h-12 text-primary/60 mx-auto" />
              <h2 className="mt-4 text-2xl font-bold">Connect Your Wallet</h2>
              <p className="mt-2 text-muted-foreground">
                You need to connect your wallet to create a new form. This allows us to verify your ownership and encrypt the form data.
              </p>
            </div>
          </AnimatedTransition>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-20">
        <AnimatedTransition>
          <FormCreator />
        </AnimatedTransition>
      </div>
    </Layout>
  );
};

export default Create;
