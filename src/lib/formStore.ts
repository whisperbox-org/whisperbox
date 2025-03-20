// This is a temporary in-memory store for demonstration purposes
// In a real implementation, this would be stored encrypted and distributed

import { FormType, FormResponse, FormCreationParams, FormSubmissionParams } from '@/types/form';
import { checkNFTOwnership, getENS } from './wallet';
import { FORM_CONFIG } from '@/config/form';
import { sha256 } from 'ethers';
import { utf8ToBytes} from "@waku/sdk"

// In-memory store
let forms: FormType[] = [];

export const formId = (form: FormType): string => {
  return sha256(utf8ToBytes(form.title+form.creator+form.createdAt))
}
// Create a new form
export const createForm = (form: FormCreationParams): FormType => {
  const ts = Date.now()
  const newForm: FormType = {
    ...form,
    id: "",
    createdAt: ts,
    responses: [],
  };

  newForm.id = formId(newForm);
  
  forms = [...forms, newForm];
  return newForm;
};

export const addForm = (form: FormType) => {
  forms = [...forms, form];
}

// Get all forms
export const getAllForms = (): FormType[] => {
  return forms;
};

// Get forms created by a specific address
export const getFormsByCreator = (creator: string): FormType[] => {
  return forms.filter(form => form.creator.toLowerCase() === creator.toLowerCase());
};

// Get a specific form
export const getFormById = (id: string): FormType | undefined => {
  return forms.find(form => form.id === id);
};

// Submit a response to a form
export const submitResponse = async (response: FormSubmissionParams): Promise<FormResponse> => {
  const formIndex = forms.findIndex(form => form.id === response.formId);
  
  if (formIndex === -1) {
    throw new Error('Form not found');
  }

  if (!response.respondent) {
    throw new Error('Respondent address is required');
  }

  if(!await canAccessForm(response.formId, response.respondent)) {
    throw new Error('Respondent is not allowed to respond');
  }
  
  const newResponse: FormResponse = {
    ...response,
    id: `r${Date.now()}`,
    submittedAt: Date.now(),
    respondentENS: await getENS(response.respondent),
  };
  
  if (forms[formIndex].responses.findIndex(r => r.respondent.toLowerCase() == response.respondent.toLowerCase()) != -1) {
    throw new Error('Response already exists for this respondent');
  }

  // Add the response to the form
  forms[formIndex].responses.push(newResponse);
  
  return newResponse;
};

// Delete a form
export const deleteForm = (id: string): void => {
  forms = forms.filter(form => form.id !== id);
};

// Check if a form is accessible by a user (via whitelist)
export const canAccessForm = async (formId: string, userAddress: string): Promise<boolean> => {
  const form = getFormById(formId);
  
  if (!form) {
    return false;
  }
  
  // If there's no user address, they can't access any form
  if (!userAddress) {
    return false;
  }
  
  // If the user is the creator, they can always access it
  if (form.creator.toLowerCase() === userAddress.toLowerCase()) {
    return true;
  }
  
  // If the form has no access control, anyone with a wallet can access it
  if (form.whitelist.type === FORM_CONFIG.WHITELIST_TYPES.NONE) {
    return true; // As long as they have a wallet (userAddress is checked above)
  }
  
  // Check whitelist
  if (form.whitelist.type === FORM_CONFIG.WHITELIST_TYPES.NFT) {
    // Use the imported checkNFTOwnership function directly
    return checkNFTOwnership(userAddress, form.whitelist.value);
  } else if (form.whitelist.type === FORM_CONFIG.WHITELIST_TYPES.ADDRESSES) {
    // Check if the address is in the whitelist
    const whitelist = form.whitelist.value.split(',').map(addr => addr.trim().toLowerCase());
    return whitelist.includes(userAddress.toLowerCase());
  }
  
  return false;
};

// Check if a user has already responded to a form
export const hasResponded = (formId: string, userAddress: string | null): boolean => {
  const form = getFormById(formId);
  
  if (!form) {
    return false;
  }
  
  // If it's a public form (no access control) and no wallet is connected,
  // we can't track if the user has already responded, so return false
  if (form.whitelist.type === FORM_CONFIG.WHITELIST_TYPES.NONE && !userAddress) {
    return false;
  }
  
  // If user has a wallet connected, check if this wallet has already submitted
  if (userAddress) {
    return form.responses.some(
      response => response.respondent.toLowerCase() === userAddress.toLowerCase()
    );
  }
  
  return false;
}; 