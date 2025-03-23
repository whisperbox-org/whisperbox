/**
 * Wallet Configuration
 * Constants and configuration related to blockchain wallets and interactions.
 */

// Simple ERC-721 interface for NFT ownership check
export const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

// Wallet configuration
export const WALLET_CONFIG = {  
  // ERC-721 ABI for NFT ownership checks
  ERC721_ABI: ERC721_ABI,
}; 

export const WALLET_EVENT_NAMES = {
  WALLET_DISCONNECTED: 'wallet_disconnected',
  WALLET_CHANGED: 'wallet_changed',
  NETWORK_CHANGED: 'network_changed',
}; 

// Multiple mainnet RPC endpoints for fallback
export const MAINNET_RPC_URLS = [
  "https://ethereum.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com"
];

export const ETHERSCAN_URLS: Record<string, string> = {
  'homestead': 'https://etherscan.io',
  'mainnet': 'https://etherscan.io',
  'sepolia': 'https://sepolia.etherscan.io',
  'goerli': 'https://goerli.etherscan.io',
  'ropsten': 'https://ropsten.etherscan.io', 
  'kovan': 'https://kovan.etherscan.io',     
  'rinkeby': 'https://rinkeby.etherscan.io', 
};

// Simple in-memory ENS cache with 1-hour expiration
export const ENS_CACHE = new Map<string, { name: string | null, timestamp: number }>();
export const ENS_CACHE_TTL = 60 * 60 * 24 * 1000;  // 1 day in milliseconds
