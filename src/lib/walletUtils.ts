
// This is a mock implementation for the wallet functionality
// In a real implementation, this would use web3.js, ethers.js, or other Web3 libraries

// Sample addresses for demo
const SAMPLE_ADDRESSES = [
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8',
  '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
  '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
];

// NFT ownership status for the sample addresses
const NFT_OWNERSHIP: Record<string, boolean> = {
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F': true,
  '0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8': true,
  '0x2546BcD3c84621e976D8185a91A922aE77ECEc30': false,
  '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E': false,
};

// Store wallet connection
const STORAGE_KEY = 'secureform-wallet';

export const connectWallet = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Simulate random wallet selection
      const randomIndex = Math.floor(Math.random() * SAMPLE_ADDRESSES.length);
      const selectedAddress = SAMPLE_ADDRESSES[randomIndex];
      
      // Store in localStorage for persistence
      localStorage.setItem(STORAGE_KEY, selectedAddress);
      
      // Simulate network delay
      setTimeout(() => {
        resolve(selectedAddress);
      }, 500);
    } catch (error) {
      reject(new Error('Failed to connect wallet'));
    }
  });
};

export const disconnectWallet = async (): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.removeItem(STORAGE_KEY);
    resolve();
  });
};

export const getConnectedWallet = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const checkNFTOwnership = async (address: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Check if this address owns the required NFT
      resolve(NFT_OWNERSHIP[address] || false);
    }, 800);
  });
};

export const signMessage = async (message: string): Promise<string> => {
  const address = getConnectedWallet();
  if (!address) {
    throw new Error('No wallet connected');
  }
  
  // In a real implementation, this would call the wallet to sign the message
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock signature
      const signature = `0x${Array(130)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('')}`;
      resolve(signature);
    }, 500);
  });
};

// Verify if a user is whitelisted
export const isWhitelisted = async (
  address: string, 
  formId: string
): Promise<boolean> => {
  // In this mock, we just check for NFT ownership
  return checkNFTOwnership(address);
};
