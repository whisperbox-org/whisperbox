import { ethers } from 'ethers';

// Simple ERC-721 interface for NFT ownership check
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

// Storage key for session persistence
const STORAGE_KEY = 'secureform-wallet';

// Ethereum provider cache
let _provider: ethers.BrowserProvider | null = null;

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
    localStorage.setItem(STORAGE_KEY, address);
    
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
    localStorage.removeItem(STORAGE_KEY);
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
  return localStorage.getItem(STORAGE_KEY);
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
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    
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

// Set up wallet event listeners
if (typeof window !== 'undefined' && 'ethereum' in window && window.ethereum) {
  const ethereum = window.ethereum;
  
  ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('wallet_disconnected'));
    } else {
      // User switched accounts
      localStorage.setItem(STORAGE_KEY, accounts[0]);
      window.dispatchEvent(new Event('wallet_changed'));
    }
  });
  
  ethereum.on('chainChanged', (_chainId: string) => {
    // Network changed, refresh the page
    window.dispatchEvent(new Event('network_changed'));
  });
}
