import { FormType, FormResponse, FormCreationParams, FormSubmissionParams, StoredForm, StoredFormType } from '@/types/form';
import { walletService } from './wallet';
import { FORM_CONFIG } from '@/config/form';
import { STORAGE_KEYS } from '@/config/storage';
import { sha256 } from 'ethers';
import { utf8ToBytes} from "@waku/sdk"
import { generatePrivateKey, getPublicKey } from "@waku/message-encryption";



// In-memory store
let forms: FormType[] = [];

export const formId = (form: FormType): string => {
  return sha256(utf8ToBytes(form.title+form.creator+form.createdAt))
}
// Validate form creator's signature
export const validateFormCreator = (form: FormType): { valid: boolean; error?: string } => {
  if (!form.signature) {
    return { valid: false, error: "Form signature is missing" };
  }
  
  const messageToSign = walletService.formatFormCreationMessage(
    form.title,
    form.creator,
    form.createdAt
  );
  
  try {
    const recoveredAddress = walletService.recoverAddress(messageToSign, form.signature);
    if (recoveredAddress.toLowerCase() !== form.creator.toLowerCase()) {
      return { valid: false, error: "Signature does not match creator address" };
    }
    return { valid: true };
  } catch (e) {
    console.error("Form creator signature validation failed:", e);
    return { valid: false, error: "Signature validation failed" };
  }
};

// Create a new form
export const createForm = (form: FormCreationParams): FormType => {
  // Validate the form signature
  if (!form.signature) {
    throw new Error("Form signature is required");
  }
  
  const privateKey = generatePrivateKey()
  const newForm: FormType = {
    ...form,
    id: "",
    responses: [],
    privateKey: toHexString(privateKey),
    publicKey: toHexString(getPublicKey(privateKey)),
    confirmations: []
  };

  newForm.id = formId(newForm);
  
  // Validate the creator's signature before storing
  const validation = validateFormCreator(newForm);
  if (!validation.valid) {
    throw new Error(validation.error || "Form signature validation failed");
  }
  
  storeForm(newForm.id, newForm.privateKey, StoredFormType.CREATOR)
  
  forms = [...forms, newForm];
  return newForm;
};

export const addForm = (form: FormType) => {
  if (!validateForm(form)) throw new Error(`Invalid form ${form.id}`)
  if (getFormById(form.id)) return
  let loaded = false
  const wallet = walletService.getConnectedWallet()
  if (form.creator == wallet) {
    try {
      form.privateKey = loadStoredForm(form.id).privateKey
      loaded = true
    } catch (e) {
      console.error("Form created by us, but PrivateKey is missing - ignoring", form.id)
      throw e
    }
  }

  const response = loadResponse(form.id)
  if (response) {
    form.responses.push({...response, id: "", respondentENS: ""}) //FIXME
  }
  forms = [...forms, form];
  if (!loaded) {
    storeForm(form.id, form.privateKey, StoredFormType.ACCESSIBLE)
  }
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
  return forms.map(form => normalizeQuestionType(form));
};

// Get forms created by a specific address
export const getFormsByCreator = (creator: string): FormType[] => {
  return forms.filter(form => form.creator.toLowerCase() === creator.toLowerCase() && form.privateKey)
    .map(form => normalizeQuestionType(form));
};

// Get a specific form
export const getFormById = (id: string): FormType | undefined => {
  const form = forms.find(f => f.id === id);
  return form ? normalizeQuestionType(form) : undefined;
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

  if (forms[formIndex].whitelist.type !== 'none') {
    if (!response.signature  || response.signature.length == 0) {
      throw new Error("Missing signature")
    }

    const recoveredAddress = walletService.recoverAddress(
      walletService.formatMessageToSign(response.formId, response.respondent, response.submittedAt), 
      response.signature
    )

    if (response.respondent.toLowerCase() != recoveredAddress.toLowerCase()) {
      throw new Error('Respondent does not match the signature')
    }
  }

  if(!await canAccessFormById(response.formId, response.respondent)) {
    throw new Error('Respondent is not allowed to respond');
  }
  
  const newResponse: FormResponse = {
    ...response,
    id: `r${Date.now()}`,
    respondentENS: await walletService.getENS(response.respondent),
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
  if (loadStoredForm(response.formId)) {
    updateStoredForm(response.formId, StoredFormType.PARTICIPATED)
  } else {
    storeForm(response.formId, "", StoredFormType.PARTICIPATED)
  }

  return newResponse
}

// Delete a form
export const deleteForm = (id: string): void => {
  forms = forms.filter(form => form.id !== id);
};

// Check if a form is accessible by a user (via whitelist)
export const canAccessForm = async (formIdOrForm: string | FormType, userAddress: string): Promise<boolean> => {
  const form = typeof formIdOrForm === 'string' ? getFormById(formIdOrForm) : formIdOrForm;
  
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
    return walletService.checkNFTOwnership(userAddress, form.whitelist.value);
  } else if (form.whitelist.type === FORM_CONFIG.WHITELIST_TYPES.ADDRESSES) {
    // Check if the address is in the whitelist
    const whitelist = form.whitelist.value.split(',').map(addr => addr.trim().toLowerCase());
    return whitelist.includes(userAddress.toLowerCase());
  }
  
  return false;
};

export const canAccessFormById = async (formId: string, userAddress: string): Promise<boolean> => {
  return canAccessForm(formId, userAddress);
}

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

const storedFormsKey = STORAGE_KEYS.STORED_FORMS

export const storeForm = (formId: string, privateKey: string, type: StoredFormType): void =>  {
    const formKeys:StoredForm[] = JSON.parse(localStorage.getItem(storedFormsKey) || "[]")
  
    const formIndex = formKeys.findIndex(f => f.id == formId)

    if (formIndex >= 0) {
      throw new Error("Form key already stored")
    }

    const updatedFormKeys = [...formKeys, {id: formId, privateKey: privateKey, type: type}]
    localStorage.setItem(storedFormsKey, JSON.stringify(updatedFormKeys))
}

export const updateStoredForm = (formId: string, type: StoredFormType): void => {
    const formKeys:StoredForm[] = JSON.parse(localStorage.getItem(storedFormsKey) || "[]")
    
    const formIndex = formKeys.findIndex(f => f.id == formId)

    if (formIndex < 0) {
      throw new Error("Form does not exist")
    }

    formKeys[formIndex].type = type
    localStorage.setItem(storedFormsKey, JSON.stringify(formKeys))
}

export const loadStoredForm = (formId: string): StoredForm => {
    const formKeys:StoredForm[] = JSON.parse(localStorage.getItem(storedFormsKey) || "[]")
    
    const formIndex = formKeys.findIndex(f => f.id == formId)

    if (formIndex < 0) {
      throw new Error("Form does not exists")
    }

    return formKeys[formIndex]
}

export const getStoredForms = (): StoredForm[] => {
    return JSON.parse(localStorage.getItem(storedFormsKey) || "[]")
}

const responseKey = STORAGE_KEYS.STORED_RESPONSES
export const persistResponse = (response: FormSubmissionParams): void =>  {
  const responses:FormSubmissionParams[] = JSON.parse(localStorage.getItem(responseKey) || "[]")

  const formIndex = responses.findIndex(f => f.formId == response.formId)

  if (formIndex >= 0) {
    throw new Error("Response already exists")
  }

  const updatedResponses = [...responses, response]
  localStorage.setItem(responseKey, JSON.stringify(updatedResponses))
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

// Define an interface for the legacy form question type for backward compatibility
interface LegacyFormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'multipleChoice' | 'checkbox';
  text: string;
  required: boolean;
  options?: string[];
}

// Ensure backwards compatibility with old forms that use 'multipleChoice' instead of 'radioButtons'
const normalizeQuestionType = (form: FormType): FormType => {
  const normalizedQuestions = form.questions.map(question => {
    // Cast to the legacy type for backward compatibility
    const legacyQuestion = question as unknown as LegacyFormQuestion;
    if (legacyQuestion.type === 'multipleChoice') {
      return {
        ...question,
        type: 'radioButtons' as const
      };
    }
    return question;
  });

  return {
    ...form,
    questions: normalizedQuestions
  };
};

// Add normalization to existing functions that retrieve forms
export const getForm = (formId: string): FormType | null => {
  try {
    // Apply normalization before returning
    const form = getFormById(formId);
    return form ? normalizeQuestionType(form) : null;
  } catch (error) {
    console.error("Error retrieving form:", error);
    return null;
  }
};

export const validateForm = (form:FormType):boolean => {
  if (!form.createdAt ||
    !form.creator ||
    !form.id ||
    !form.signature ||
    !form.title ||
    !form.publicKey ||
    !form.confirmations
  ) return false

  return true
}

export const formToCSV = (form: FormType) => {
  const csvData: string[][] = [form.questions.map(q => q.text)]

  for (const response of form.responses) {
    const rData = response.answers.map((a):string | undefined => {
      const question = form.questions.find(q => q.id == a.questionId)
      if (!question) return undefined
      
      switch (question.type) {
        case 'text':
          return a.value as string
        case 'textarea':
          return a.value as string
        case 'checkbox':
          return (a.value as number[]).map(a => question.options![a]).join(', ')
        case 'radioButtons':
          return question.options![a.value as number]
      }
    })
    csvData.push(rData.filter(d => d !== undefined))
  }

  return csvData
}