
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldX, AlertTriangle, Loader } from 'lucide-react';
import { checkNFTOwnership, getConnectedWallet } from '@/lib/walletUtils';

interface NFTGateProps {
  children: React.ReactNode;
  contractAddress: string;
  fallback?: React.ReactNode;
}

const NFTGate: React.FC<NFTGateProps> = ({ 
  children, 
  contractAddress, 
  fallback 
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      setIsVerifying(true);
      const address = getConnectedWallet();
      setWalletAddress(address);
      
      if (!address) {
        setIsVerifying(false);
        setHasAccess(false);
        return;
      }
      
      try {
        // Add a small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const hasNFT = await checkNFTOwnership(address);
        setHasAccess(hasNFT);
      } catch (error) {
        console.error('Error checking NFT ownership:', error);
        setHasAccess(false);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyAccess();
  }, [contractAddress]);

  if (isVerifying) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative">
            <Shield className="w-16 h-16 text-primary/20" />
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <h3 className="mt-6 text-xl font-semibold">Verifying NFT Ownership</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            We're checking if your wallet owns the required NFT to access this content...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <AlertTriangle className="w-16 h-16 text-amber-500" />
          <h3 className="mt-6 text-xl font-semibold">Wallet Not Connected</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Please connect your wallet to verify NFT ownership and access this content.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <ShieldX className="w-16 h-16 text-destructive/80" />
          <h3 className="mt-6 text-xl font-semibold">Access Denied</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Your wallet does not own the required NFT to access this content. 
            Please connect a wallet that owns the required NFT.
          </p>
          <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
            <p>Required NFT: Ordinal (Logos Operator NFT)</p>
            <p className="text-xs text-muted-foreground mt-1">Contract: {contractAddress}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default NFTGate;
