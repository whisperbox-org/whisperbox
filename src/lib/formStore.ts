// This is a temporary in-memory store for demonstration purposes
// In a real implementation, this would be stored encrypted and distributed

export interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'multipleChoice' | 'checkbox';
  text: string;
  required: boolean;
  options?: string[]; // For multiple choice or checkbox
}

export interface FormType {
  id: string;
  title: string;
  description: string;
  creator: string;
  createdAt: string;
  expiresAt?: string; // Optional expiry timestamp
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
  submittedAt: string;
  answers: {
    questionId: string;
    value: string | string[];
  }[];
}

// Sample form data for demonstration
const sampleForms: FormType[] = [
  {
    id: 'f1',
    title: 'Logos Operator Program Survey',
    description: 'This survey is exclusively for Logos Operators holding an Ordinal NFT.',
    creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    questions: [
      {
        id: 'q1',
        type: 'text',
        text: 'What is your operator node ID?',
        required: true,
      },
      {
        id: 'q2',
        type: 'multipleChoice',
        text: 'How long have you been running your node?',
        required: true,
        options: ['Less than 1 month', '1-3 months', '3-6 months', '6+ months'],
      },
      {
        id: 'q3',
        type: 'textarea',
        text: 'What challenges have you faced while operating your node?',
        required: false,
      },
      {
        id: 'q4',
        type: 'checkbox',
        text: 'Which of the following improvements would you like to see? (Select all that apply)',
        required: true,
        options: [
          'Better documentation',
          'Simplified setup process',
          'More incentives',
          'Better monitoring tools',
          'Community support',
        ],
      },
    ],
    whitelist: {
      type: 'nft',
      value: '0x1234567890123456789012345678901234567890', // Fictional NFT contract
    },
    responses: [],
  },
  {
    id: 'f2',
    title: 'Governance Proposal Feedback',
    description: 'Provide your feedback on the latest governance proposal.',
    creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    questions: [
      {
        id: 'q1',
        type: 'multipleChoice',
        text: 'Do you support the proposed change?',
        required: true,
        options: ['Yes', 'No', 'Abstain'],
      },
      {
        id: 'q2',
        type: 'textarea',
        text: 'Please provide your reasoning.',
        required: true,
      },
    ],
    whitelist: {
      type: 'nft',
      value: '0x1234567890123456789012345678901234567890',
    },
    responses: [],
  },
];

// In-memory store
let forms = [...sampleForms];

// Create a new form
export const createForm = (form: Omit<FormType, 'id' | 'responses' | 'createdAt'>): FormType => {
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
export const submitResponse = (response: Omit<FormResponse, 'id' | 'submittedAt'>): FormResponse => {
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
