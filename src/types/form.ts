/**
 * Form related type definitions
 */

export interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radioButtons' | 'checkbox';
  text: string;
  required: boolean;
  options?: string[]; // For radio buttons (single selection) or checkboxes (multiple selection)
}

export interface FormType {
  id: string;
  title: string;
  description: string;
  creator: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
  expiresAt?: number; // Optional expiry timestamp
  questions: FormQuestion[];
  whitelist: {
    type: 'nft' | 'addresses' | 'none';
    value: string; // NFT contract address or comma-separated list of addresses or empty string for none
  };
  responses: FormResponse[];
  confirmations: string[];
  signature: string; // Signature from creator to verify identity
}

export interface FormResponse {
  id: string;
  formId: string;
  respondent: string; // Wallet address
  respondentENS: string | null;
  submittedAt: number;
  signature: string;
  answers: {
    questionId: string;
    value: string | number | number[];
  }[];
  confirmationId: string | null;
}

export interface ResponseConfirmation {
  formId: string;
  confirmationId: string;
}

export interface StoredForm {
  id: string,
  privateKey: string
  type: StoredFormType
}

export enum StoredFormType {
  ACCESSIBLE = 'accessible',
  VIEWED = 'viewed',
  PARTICIPATED = 'participated',
  CREATOR = 'creator'
}

// Form creation parameter type (omitting generated fields)
export type FormCreationParams = Omit<FormType, 'id' | 'responses' | 'publicKey' | 'privateKey' | 'confirmations'>;

// Form submission parameter type (omitting generated fields)
export type FormSubmissionParams = Omit<FormResponse, 'id' | 'respondentENS'>;