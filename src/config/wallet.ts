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
  // Storage key for session persistence
  STORAGE_KEY: 'secureform-wallet',
  
  // ERC-721 ABI for NFT ownership checks
  ERC721_ABI: ERC721_ABI,
}; 

export const WALLET_EVENT_NAMES = {
  WALLET_DISCONNECTED: 'wallet_disconnected',
  WALLET_CHANGED: 'wallet_changed',
  NETWORK_CHANGED: 'network_changed',
}; 