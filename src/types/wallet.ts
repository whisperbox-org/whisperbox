/**
 * Wallet related type definitions
 */

import { ethers } from 'ethers';

// Define window Ethereum provider interface
export interface EthereumProvider extends ethers.Eip1193Provider {
  isMetaMask?: boolean;
  selectedAddress?: string;
  isConnected?(): boolean;
  chainId?: string;
  request: (request: { method: string; params?: Array<unknown> }) => Promise<unknown>;
  
  // Typed event handlers
  on(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
  on(event: 'chainChanged', listener: (chainId: string) => void): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
}

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Wallet connection status
export type WalletStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// Wallet information
export interface WalletInfo {
  address: string;
  balance: string;
  network: {
    name: string;
    chainId: number;
  };
}

// Wallet connection events
export type WalletEvent = 'wallet_connected' | 'wallet_disconnected' | 'wallet_changed' | 'network_changed'; 