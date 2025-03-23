import { ethers } from 'ethers';
import { ENS_CACHE, ENS_CACHE_TTL, MAINNET_RPC_URLS, WALLET_CONFIG, WALLET_EVENT_NAMES } from '@/config/wallet';
import { STORAGE_KEYS } from '@/config/storage';

let _provider: ethers.BrowserProvider | null = null;
let _mainnetProvider: ethers.JsonRpcProvider | null = null;

/**
 * Get the Ethereum provider
 * @returns ethers.BrowserProvider if available
 * @throws Error if no provider is available
 */
const getProvider = async (): Promise<ethers.BrowserProvider> => {
  if (!_provider) {
    // Check if ethereum object is available
    if (typeof window !== 'undefined' && 'ethereum' in window && window.ethereum) {
      // Use the typed ethereum provider
      _provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
    } else {
      throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
    }
  }
  return _provider;
};

/**
 * Get a dedicated Ethereum mainnet provider for ENS resolution
 * This provider always connects to mainnet regardless of wallet network
 * @returns ethers.JsonRpcProvider connected to Ethereum mainnet
 */
const getMainnetProvider = (): ethers.JsonRpcProvider => {
  if (!_mainnetProvider) {
    for (let i = 0; i < MAINNET_RPC_URLS.length; i++) {
      try {
        _mainnetProvider = new ethers.JsonRpcProvider(MAINNET_RPC_URLS[i]);
        console.log(`Connected to mainnet using provider ${i+1}`);
        break;
      } catch (error) {
        console.error(`Failed to connect to mainnet provider ${i+1}:`, error);
      }
    }
    
    if (!_mainnetProvider) {
      console.warn("All mainnet providers failed, using first provider anyway");
      _mainnetProvider = new ethers.JsonRpcProvider(MAINNET_RPC_URLS[0]);
    }
  }
  return _mainnetProvider;
};

/**
 * Connect to a wallet provider
 * @returns connected wallet address
 */
export const connectWallet = async (): Promise<string> => {
  try {
    const provider = await getProvider();
    
    // Request account access
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (accounts.length === 0) {
      throw new Error('No accounts found or user rejected the connection');
    }
    
    const address = accounts[0];
    
    // Store in localStorage for persistence
    localStorage.setItem(STORAGE_KEYS.WALLET, address);
    
    return address;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to connect wallet');
  }
};

/**
 * Disconnect the wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEYS.WALLET);
    _provider = null;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw new Error('Failed to disconnect wallet');
  }
};

/**
 * Get the currently connected wallet address
 * @returns wallet address or null if not connected
 */
export const getConnectedWallet = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.WALLET);
};

/**
 * Get the network the wallet is connected to
 * @returns network information
 */
export const getNetwork = async (): Promise<ethers.Network> => {
  try {
    const provider = await getProvider();
    return provider.getNetwork();
  } catch (error) {
    console.error('Error getting network:', error);
    throw new Error('Failed to get network information');
  }
};

/**
 * Get the balance of the connected wallet
 * @returns balance in ETH
 */
export const getBalance = async (address?: string): Promise<string> => {
  try {
    const provider = await getProvider();
    const walletAddress = address || getConnectedWallet();
    
    if (!walletAddress) {
      throw new Error('No wallet connected');
    }
    
    const balance = await provider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw new Error('Failed to get wallet balance');
  }
};

/**
 * Get the ENS name for a wallet address
 * Always uses Ethereum mainnet regardless of wallet's current network
 * @param address optional wallet address (uses connected wallet if not provided)
 * @returns ENS name or null if not found
 */
export const getENS = async (address?: string): Promise<string | null> => {
  try {
    const walletAddress = address || getConnectedWallet(); 
    console.log("Resolving ENS for wallet address:", walletAddress);

    if (!walletAddress) {
      return null;
    }
    
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check cache first
    const cached = ENS_CACHE.get(normalizedAddress);
    if (cached && (Date.now() - cached.timestamp < ENS_CACHE_TTL)) {
      console.log(`Using cached ENS for ${normalizedAddress}: ${cached.name || "No ENS found"}`);
      return cached.name;
    }

    // Use dedicated mainnet provider for ENS resolution
    try {
      const provider = getMainnetProvider();
      const ensName = await provider.lookupAddress(normalizedAddress);
      
      ENS_CACHE.set(normalizedAddress, { 
        name: ensName, 
        timestamp: Date.now() 
      });
      
      console.log(`Resolved ENS for ${normalizedAddress}: ${ensName || "No ENS found"}`);
      return ensName;
    } catch (providerError) {
      console.error("Error with primary provider:", providerError);
      
      // Try fallback if primary provider fails
      for (let i = 0; i < MAINNET_RPC_URLS.length; i++) {
        try {
          // Skip the first URL if that's what failed
          if (i === 0 && _mainnetProvider) continue;
          
          console.log(`Trying fallback provider ${i+1} for ENS resolution`);
          const fallbackProvider = new ethers.JsonRpcProvider(MAINNET_RPC_URLS[i]);
          const ensName = await fallbackProvider.lookupAddress(normalizedAddress);
          
          // Cache the result
          ENS_CACHE.set(normalizedAddress, { 
            name: ensName, 
            timestamp: Date.now() 
          });
          
          // Update the main provider to use this working one
          _mainnetProvider = fallbackProvider;
          
          console.log(`Resolved ENS using fallback provider ${i+1}: ${ensName || "No ENS found"}`);
          return ensName;
        } catch (fallbackError) {
          console.error(`Fallback provider ${i+1} failed:`, fallbackError);
        }
      }
      
      // If all fallbacks fail, cache null result to avoid repeated failures
      ENS_CACHE.set(normalizedAddress, { name: null, timestamp: Date.now() });
      return null;
    }
  } catch (error) {
    console.error('Error getting ENS:', error);
    return null;
  }
}

/**
 * Check if an address owns a specific NFT
 * @param address wallet address to check
 * @param contractAddress NFT contract address
 * @param tokenId optional specific token ID to check
 * @returns true if the address owns the NFT
 */
export const checkNFTOwnership = async (
  address: string,
  contractAddress: string,
  tokenId?: number
): Promise<boolean> => {
  try {
    const provider = await getProvider();
    const contract = new ethers.Contract(contractAddress, WALLET_CONFIG.ERC721_ABI, provider);
    
    if (tokenId !== undefined) {
      // Check if the address owns a specific token
      try {
        const owner = await contract.ownerOf(tokenId);
        return owner.toLowerCase() === address.toLowerCase();
      } catch {
        return false;
      }
    } else {
      // Check if the address owns any tokens from this collection
      const balance = await contract.balanceOf(address);
      return Number(balance) > 0;
    }
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return false;
  }
};

/**
 * Sign a message with the connected wallet
 * @param message message to sign
 * @returns signature
 */
export const signMessage = async (message: string): Promise<string> => {
  try {
    const provider = await getProvider();
    const address = getConnectedWallet();
    
    if (!address) {
      throw new Error('No wallet connected');
    }
    
    const signer = await provider.getSigner();
    return signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message');
  }
};

/**
 * Verify if a user is whitelisted for a form
 * @param address wallet address
 * @param nftContract NFT contract address for verification
 * @returns true if the user is whitelisted
 */
export const isWhitelisted = async (
  address: string, 
  nftContract: string
): Promise<boolean> => {
  return checkNFTOwnership(address, nftContract);
};

export const formatMessageToSign = (formId:string, walletAddress: string, ts: number): string => {
  return `Submitting form response to ${formId} as ${walletAddress} at ${new Date(ts)}`
}

export const formatFormCreationMessage = (formTitle: string, walletAddress: string, timestamp: number): string => {
  return `Creating form "${formTitle}" at ${new Date(timestamp)} as ${walletAddress}`;
};

export const recoverAddress = (msg: string, signature: string): string => {
  return ethers.verifyMessage(msg, signature)
}

// Set up wallet event listeners
if (typeof window !== 'undefined' && 'ethereum' in window && window.ethereum) {
  const ethereum = window.ethereum;
  
  ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      localStorage.removeItem(STORAGE_KEYS.WALLET);
      window.dispatchEvent(new Event(WALLET_EVENT_NAMES.WALLET_DISCONNECTED));
    } else {
      // User switched accounts
      localStorage.setItem(STORAGE_KEYS.WALLET, accounts[0]);
      window.dispatchEvent(new Event(WALLET_EVENT_NAMES.WALLET_CHANGED));
    }
  });
  
  ethereum.on('chainChanged', (_chainId: string) => {
    // Network changed, refresh the page
    window.dispatchEvent(new Event(WALLET_EVENT_NAMES.NETWORK_CHANGED));
  });
}
