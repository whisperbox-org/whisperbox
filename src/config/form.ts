/**
 * Form Configuration
 * Constants and types related to forms and surveys.
 */

// Default question template
const DEFAULT_QUESTION = {
  type: 'text' as const,
  required: true,
  options: [],
};

// Whitelist types for form access control
const WHITELIST_TYPES = {
  NONE: 'none',
  NFT: 'nft',
  ADDRESSES: 'addresses',
} as const;

// Question types available in forms
const QUESTION_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  MULTIPLE_CHOICE: 'multipleChoice',
  CHECKBOX: 'checkbox',
} as const; 


export const FORM_CONFIG = {
  DEFAULT_QUESTION,
  WHITELIST_TYPES,
  QUESTION_TYPES,
};