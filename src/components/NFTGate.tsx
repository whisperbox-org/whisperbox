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
        const hasNFT = await checkNFTOwnership(address, contractAddress);
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
      <div className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-xl shadow-sm">
        <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-medium mb-2">Verifying NFT Ownership</h3>
        <p className="text-muted-foreground text-center">
          Checking if your wallet owns the required NFT...
        </p>
      </div>
    );
  }
  
  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-xl shadow-sm">
        <Shield className="w-10 h-10 text-amber-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Wallet Not Connected</h3>
        <p className="text-muted-foreground text-center mb-4">
          Please connect your wallet to verify NFT ownership and access this content.
        </p>
      </div>
    );
  }
  
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <motion.div 
        className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-xl shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <ShieldX className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground text-center mb-2">
          Your wallet does not own the required NFT to access this content.
        </p>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Required NFT:</p>
            <p className="font-mono text-xs break-all">{contractAddress}</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default NFTGate;
