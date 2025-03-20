/**
 * Form related type definitions
 */

export interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'singleChoice' | 'multipleChoice';
  text: string;
  required: boolean;
  options?: string[]; // For multiple choice or checkbox
}

export interface FormType {
  id: string;
  title: string;
  description: string;
  creator: string;
  createdAt: number;
  expiresAt?: number; // Optional expiry timestamp
  questions: FormQuestion[];
  whitelist: {
    type: 'nft' | 'addresses' | 'none';
    value: string; // NFT contract address or comma-separated list of addresses or empty string for none
  };
  responses: FormResponse[];
}

export interface FormResponse {
  id: string;
  formId: string;
  respondent: string; // Wallet address
  respondentENS: string | null;
  submittedAt: number;
  answers: {
    questionId: string;
    value: string | number | number[];
  }[];
}

// Form creation parameter type (omitting generated fields)
export type FormCreationParams = Omit<FormType, 'id' | 'responses' | 'createdAt'>;

// Form submission parameter type (omitting generated fields)
export type FormSubmissionParams = Omit<FormResponse, 'id' | 'submittedAt' | 'respondentENS'>; 