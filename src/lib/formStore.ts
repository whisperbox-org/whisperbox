// This is a temporary in-memory store for demonstration purposes
// In a real implementation, this would be stored encrypted and distributed

import { FormType, FormResponse, FormCreationParams, FormSubmissionParams, FormKeys } from '@/types/form';
import { checkNFTOwnership, getENS } from './wallet';
import { FORM_CONFIG } from '@/config/form';
import { sha256 } from 'ethers';
import { bytesToUtf8, utf8ToBytes} from "@waku/sdk"
import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";
import { utils } from "@noble/secp256k1"



// In-memory store
let forms: FormType[] = [];

export const formId = (form: FormType): string => {
  return sha256(utf8ToBytes(form.title+form.creator+form.createdAt))
}
// Create a new form
export const createForm = (form: FormCreationParams): FormType => {
  const ts = Date.now()
  const privateKey = generatePrivateKey()
  const newForm: FormType = {
    ...form,
    id: "",
    createdAt: ts,
    responses: [],
    privateKey: toHexString(privateKey),
    publicKey: toHexString(getPublicKey(privateKey)),
    confirmations: []
  };

  newForm.id = formId(newForm);
  persistFormPrivateKey(newForm.id, newForm.privateKey)
  
  forms = [...forms, newForm];
  return newForm;
};

export const addForm = (form: FormType) => {
  try {
    form.privateKey = loadFormPrivateKey(form.id)
  } catch (e) {
    console.log("Did not find form key", form.id)
  }

  const response = loadResponse(form.id)
  if (response) {
    console.log("Found a response!!")
    form.responses.push({...response, id: "", respondentENS: ""}) //FIXME
  }
  forms = [...forms, form];
}

export const addConfirmation = (formId: string, confirmationId: string) => {
  const form = getFormById(formId)
  if (!form) {
    throw new Error("Form not found")
  }

  const confirmationIndex = form.confirmations.findIndex(c => c == confirmationId)
  if (confirmationIndex > -1) {
    return
  }

  form.confirmations.push(confirmationId)
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
    respondentENS: await getENS(response.respondent),
  };
  
  if (forms[formIndex].responses.findIndex(r => r.respondent.toLowerCase() == response.respondent.toLowerCase()) != -1) {
    throw new Error('Response already exists for this respondent');
  }


  // Add the response to the form
  forms[formIndex].responses.push(newResponse);
  
  return newResponse;
};

export const submitAndPersistResponse = async (response: FormSubmissionParams): Promise<FormResponse> => {
  const newResponse = await submitResponse(response)

  persistResponse(newResponse)

  return newResponse
}

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

const storageKey = "whisperbox_formKeys"

export const persistFormPrivateKey = (formId: string, privateKey: string): void =>  {
    let formKeys:FormKeys[] = JSON.parse(localStorage.getItem(storageKey) || "[]")
  
    const formIndex = formKeys.findIndex(f => f.id == formId)

    if (formIndex >= 0) {
      throw new Error("Form key already stored")
    }

    formKeys = [...formKeys, {id: formId, privateKey: privateKey}]
    localStorage.setItem(storageKey, JSON.stringify(formKeys))
}

export const loadFormPrivateKey = (formId: string): string => {
    const formKeys:FormKeys[] = JSON.parse(localStorage.getItem(storageKey) || "[]")
    
    const formIndex = formKeys.findIndex(f => f.id == formId)

    if (formIndex < 0) {
      throw new Error("Form does not exists")
    }

    return formKeys[formIndex].privateKey
}


const responseKey = "whisperbox_response"
export const persistResponse = (response: FormSubmissionParams): void =>  {
  let responses:FormSubmissionParams[] = JSON.parse(localStorage.getItem(responseKey) || "[]")

  const formIndex = responses.findIndex(f => f.formId == response.formId)

  if (formIndex >= 0) {
    throw new Error("Response already exists")
  }

  responses = [...responses, response]
  localStorage.setItem(responseKey, JSON.stringify(responses))
}

export const loadResponse = (formId: string): FormSubmissionParams | undefined => {
  const responses:FormSubmissionParams[] = JSON.parse(localStorage.getItem(responseKey) || "[]")
  
  const formIndex = responses.findIndex(f => f.formId == formId)

  if (formIndex < 0) {
    return
  }

  return responses[formIndex]
}

export function toHexString(byteArray: Uint8Array) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}
export function toByteArray(hexString: string) {
  const result = [];
  for (let i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}