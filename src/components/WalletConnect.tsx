import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, Check, Copy, ExternalLink, LogOut, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/lib/wallet';
import { ETHERSCAN_URLS } from '@/config/wallet';

const WalletConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [ensName, setENSName] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [chainId, setChainId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [connectingStatus, setConnectingStatus] = useState<'idle' | 'connecting' | 'success'>('idle');
  const { toast } = useToast();

  const getEtherscanUrl = (): { url: string | null; supported: boolean } => {
    if (!networkName && !chainId) return { url: null, supported: false };
    
    const normalizedNetworkName = networkName.toLowerCase();
    if (ETHERSCAN_URLS[normalizedNetworkName]) {
      return { url: ETHERSCAN_URLS[normalizedNetworkName], supported: true };
    }
    
    return { url: null, supported: false };
  };

  useEffect(() => {
    const storedWallet = walletService.getConnectedWallet();
    if (storedWallet) {
      setIsConnected(true);
      setWalletAddress(storedWallet);
      fetchWalletInfo(storedWallet);
      walletService.getENS(storedWallet).then((ensName) => {
        setENSName(ensName);
      });
    }


    // Set up event listeners for wallet changes
    window.addEventListener('wallet_changed', handleWalletChanged);
    window.addEventListener('wallet_disconnected', handleWalletDisconnected);
    window.addEventListener('network_changed', handleNetworkChanged);

    return () => {
      window.removeEventListener('wallet_changed', handleWalletChanged);
      window.removeEventListener('wallet_disconnected', handleWalletDisconnected);
      window.removeEventListener('network_changed', handleNetworkChanged);
    };
  }, []);

  const handleWalletChanged = () => {
    const address = walletService.getConnectedWallet();
    if (address) {
      setWalletAddress(address);
      fetchWalletInfo(address);
      toast({
        title: "Wallet changed",
        description: "Your active wallet has changed.",
      });

      window.location.reload();
    }
  };

  const handleWalletDisconnected = () => {
    setIsConnected(false);
    setWalletAddress('');
    setWalletBalance('');
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handleNetworkChanged = async () => {
    if (isConnected) {
      try {
        const network = await walletService.getNetwork();
        setNetworkName(network.name === 'homestead' ? 'Ethereum' : network.name);
        setChainId(network.chainId.toString());
        
        // Refresh balance as it might change with network
        if (walletAddress) {
          const balance = await walletService.getBalance(walletAddress);
          setWalletBalance(balance);
        }
        toast({
          title: "Network changed",
          description: `You are now connected to ${network.name === 'homestead' ? 'Ethereum' : network.name}.`,
        });
      } catch (error) {
        console.error('Error handling network change:', error);
      }
    }
  };

  const fetchWalletInfo = async (address: string) => {
    try {
      // Get wallet balance
      const balance = await walletService.getBalance(address);
      setWalletBalance(balance);
      
      // Get network info
      const network = await walletService.getNetwork();
      setNetworkName(network.name === 'homestead' ? 'Ethereum' : network.name);
      setChainId(network.chainId.toString());
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setConnectingStatus('connecting');
      
      const address = await walletService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      setConnectingStatus('success');
      
      // Fetch additional wallet info
      await fetchWalletInfo(address);
      
      toast({
        title: "Wallet connected",
        description: "Your wallet has been successfully connected.",
      });
      
      // Reset status after showing success
      setTimeout(() => {
        setConnectingStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setConnectingStatus('idle');
      
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not connect to your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await walletService.disconnectWallet();
      setIsConnected(false);
      setWalletAddress('');
      setWalletBalance('');
      setIsDropdownOpen(false);
      
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      
      toast({
        title: "Disconnection failed",
        description: "Could not disconnect your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard.",
    });
    setIsDropdownOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const etherscanInfo = getEtherscanUrl();

  const handleEtherscanClick = (e: React.MouseEvent) => {
    if (!etherscanInfo.supported) {
      e.preventDefault();
      toast({
        title: "Network not supported",
        description: `Etherscan does not support the ${networkName} network.`,
        variant: "destructive",
      });
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative z-50">
      {!isConnected ? (
        <motion.button
          className={`relative px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white shadow-sm button-hover 
            ${connectingStatus === 'connecting' ? 'opacity-90 cursor-wait' : ''}`}
          onClick={handleConnect}
          disabled={connectingStatus !== 'idle'}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: connectingStatus === 'idle' ? 1.02 : 1 }}
        >
          <span className="flex items-center">
            {connectingStatus === 'connecting' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                Connecting
              </>
            ) : connectingStatus === 'success' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Connected
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </span>
        </motion.button>
      ) : (
        <div>
          <motion.button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary border border-border text-foreground shadow-sm button-hover flex items-center"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse-subtle"></div>
            <span>{ensName ? ensName : formatAddress(walletAddress)}</span>
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg glassmorphism p-2 overflow-hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-b border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Connected Wallet</div>
                  <div className="font-medium truncate">{formatAddress(walletAddress)}</div>
                  
                  {walletBalance && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Balance: {parseFloat(walletBalance).toFixed(4)} ETH
                    </div>
                  )}
                  
                  {networkName && (
                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                      {networkName}
                    </div>
                  )}
                </div>
                <div className="p-1">
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors flex items-center"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </button>
                  {etherscanInfo.supported ? (
                    <a
                      href={`${etherscanInfo.url}/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Etherscan
                    </a>
                  ) : (
                    <button
                      onClick={handleEtherscanClick}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors flex items-center text-yellow-600"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      View on Etherscan (Unsupported Network)
                    </button>
                  )}
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
