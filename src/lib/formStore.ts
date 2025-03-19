// This is a temporary in-memory store for demonstration purposes
// In a real implementation, this would be stored encrypted and distributed

import { FormType, FormQuestion, FormResponse, FormCreationParams, FormSubmissionParams } from '@/types/form';


// In-memory store
let forms = [];

// Create a new form
export const createForm = (form: FormCreationParams): FormType => {
  const newForm: FormType = {
    ...form,
    id: `f${Date.now()}`,
    createdAt: new Date().toISOString(),
    responses: [],
  };
  
  forms = [...forms, newForm];
  return newForm;
};

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
export const submitResponse = (response: FormSubmissionParams): FormResponse => {
  const formIndex = forms.findIndex(form => form.id === response.formId);
  
  if (formIndex === -1) {
    throw new Error('Form not found');
  }
  
  const newResponse: FormResponse = {
    ...response,
    id: `r${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  
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
  if (form.whitelist.type === 'none') {
    return true; // As long as they have a wallet (userAddress is checked above)
  }
  
  // Check whitelist
  if (form.whitelist.type === 'nft') {
    // In a real implementation, this would check NFT ownership
    // For now, we'll use the mock functionality from walletUtils
    const { checkNFTOwnership } = await import('./walletUtils');
    return checkNFTOwnership(userAddress, form.whitelist.value);
  } else if (form.whitelist.type === 'addresses') {
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
  if (form.whitelist.type === 'none' && !userAddress) {
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