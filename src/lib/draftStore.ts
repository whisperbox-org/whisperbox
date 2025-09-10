import { FormQuestion } from '@/types/form';
import { STORAGE_KEYS } from '@/config/storage';

// Draft data interfaces
export interface FormCreationDraft {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  whitelistType: 'nft' | 'addresses' | 'none';
  whitelistValue: string;
  createdAt: number;
  updatedAt: number;
  autosave: boolean;
}

export interface FormResponseDraft {
  formId: string;
  answers: {
    questionId: string;
    value: string | number | number[] | boolean;
  }[];
  createdAt: number;
  updatedAt: number;
  autosave: boolean;
}

// Check localStorage quota
export const checkStorageQuota = (): { available: boolean; usage: number; limit: number } => {
  try {
    const testKey = '___storage_test___';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // Estimate usage
    const formsUsage = localStorage.getItem(STORAGE_KEYS.STORED_FORMS)?.length || 0;
    const responsesUsage = localStorage.getItem(STORAGE_KEYS.STORED_RESPONSES)?.length || 0;
    const draftFormsUsage = localStorage.getItem(STORAGE_KEYS.DRAFT_FORMS)?.length || 0;
    const draftResponsesUsage = localStorage.getItem(STORAGE_KEYS.DRAFT_RESPONSES)?.length || 0;
    
    const totalUsage = formsUsage + responsesUsage + draftFormsUsage + draftResponsesUsage;
    
    // Browser localStorage limit is typically 5-10MB
    // Using 5MB as conservative estimate
    const limit = 5 * 1024 * 1024; // 5MB in bytes
    
    return {
      available: totalUsage < limit * 0.9, // Allow 90% usage before warning
      usage: totalUsage,
      limit: limit
    };
  } catch (error) {
    // If we can't access localStorage at all
    return {
      available: false,
      usage: 0,
      limit: 0
    };
  }
};

// Validate form draft data
const validateFormDraft = (draft: any): draft is FormCreationDraft => {
  if (!draft || typeof draft !== 'object') {
    console.error('Invalid draft: not an object', draft);
    return false;
  }
  
  if (!draft.id || typeof draft.id !== 'string') {
    console.error('Invalid draft: missing or invalid id', draft.id);
    return false;
  }
  
  if (typeof draft.title !== 'string') {
    console.error('Invalid draft: title is not a string', typeof draft.title);
    return false;
  }
  
  if (typeof draft.description !== 'string') {
    console.error('Invalid draft: description is not a string', typeof draft.description);
    return false;
  }
  
  if (!Array.isArray(draft.questions)) {
    console.error('Invalid draft: questions is not an array', typeof draft.questions);
    return false;
  }
  
  // Validate questions
  for (const question of draft.questions) {
    if (!question.id || typeof question.id !== 'string') {
      console.error('Invalid question: missing or invalid id', question.id);
      return false;
    }
    
    if (!question.text || typeof question.text !== 'string') {
      console.error('Invalid question: missing or invalid text', question.text);
      return false;
    }
    
    if (!['text', 'textarea', 'radioButtons', 'checkbox'].includes(question.type)) {
      console.error('Invalid question: invalid type', question.type);
      return false;
    }
    
    if (typeof question.required !== 'boolean') {
      console.error('Invalid question: required is not a boolean', typeof question.required);
      return false;
    }
    
    // Validate options for choice questions
    if ((question.type === 'radioButtons' || question.type === 'checkbox') &&
        (!Array.isArray(question.options) || question.options.length === 0)) {
      console.error('Invalid question: missing or empty options for choice question', question.options);
      return false;
    }
  }
  
  if (!['nft', 'addresses', 'none'].includes(draft.whitelistType)) {
    console.error('Invalid draft: invalid whitelistType', draft.whitelistType);
    return false;
  }
  
  if (typeof draft.whitelistValue !== 'string') {
    console.error('Invalid draft: whitelistValue is not a string', typeof draft.whitelistValue);
    return false;
  }
  
  if (typeof draft.createdAt !== 'number') {
    console.error('Invalid draft: createdAt is not a number', typeof draft.createdAt);
    return false;
  }
  
  if (typeof draft.updatedAt !== 'number') {
    console.error('Invalid draft: updatedAt is not a number', typeof draft.updatedAt);
    return false;
  }
  
  if (typeof draft.autosave !== 'boolean') {
    console.error('Invalid draft: autosave is not a boolean', typeof draft.autosave);
    return false;
  }
  
  return true;
};

// Validate response draft data
const validateResponseDraft = (draft: any): draft is FormResponseDraft => {
  if (!draft || typeof draft !== 'object') return false;
  if (!draft.formId || typeof draft.formId !== 'string') return false;
  if (!Array.isArray(draft.answers)) return false;
  
  // Validate answers
  for (const answer of draft.answers) {
    if (!answer.questionId || typeof answer.questionId !== 'string') return false;
    if (answer.value === undefined) return false;
  }
  
  if (typeof draft.createdAt !== 'number') return false;
  if (typeof draft.updatedAt !== 'number') return false;
  if (typeof draft.autosave !== 'boolean') return false;
  
  return true;
};

// Safe JSON parsing with recovery
const safeParseJSON = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    
    // Try to repair common JSON issues
    try {
      // Remove trailing commas
      let repaired = jsonString.replace(/,\s*([}\]])/g, '$1');
      // Fix unescaped quotes
      repaired = repaired.replace(/([^\\])"/g, '$1\\"');
      
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error('Failed to repair JSON:', repairError);
      return fallback;
    }
  }
};

// In-memory fallback storage
class InMemoryStorage {
  private storage: Map<string, any> = new Map();
  
  getItem(key: string): string | null {
    const value = this.storage.get(key);
    return value ? JSON.stringify(value) : null;
  }
  
  setItem(key: string, value: string): void {
    try {
      this.storage.set(key, JSON.parse(value));
    } catch (error) {
      console.error('Failed to parse value for in-memory storage:', error);
    }
  }
  
  removeItem(key: string): void {
    this.storage.delete(key);
  }
  
  clear(): void {
    this.storage.clear();
  }
}

const inMemoryStorage = new InMemoryStorage();

// Get appropriate storage with fallback
const getStorage = (key: string) => {
  try {
    // Test if localStorage is available
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch (e) {
    // Fall back to in-memory storage
    console.warn('localStorage not available, using in-memory storage');
    return inMemoryStorage;
  }
};

// Save draft form
export const saveFormDraft = (draft: FormCreationDraft): boolean => {
  try {
    // Validate draft data
    if (!validateFormDraft(draft)) {
      console.error('Invalid form draft data');
      return false;
    }
    
    // Check storage quota
    const quota = checkStorageQuota();
    if (!quota.available) {
      console.warn('Storage limit exceeded, cannot save draft');
      return false;
    }
    
    const storage = getStorage(STORAGE_KEYS.DRAFT_FORMS);
    const storageKey = STORAGE_KEYS.DRAFT_FORMS;
    
    let drafts: FormCreationDraft[] = [];
    try {
      const stored = storage.getItem(storageKey);
      drafts = stored ? safeParseJSON(stored, []) : [];
    } catch (e) {
      console.warn('Failed to parse existing drafts, starting fresh');
      // Continue with empty drafts array
    }
    
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = { ...draft, updatedAt: Date.now() };
    } else {
      drafts.push({ ...draft, updatedAt: Date.now() });
    }
    
    storage.setItem(storageKey, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save form draft:', error);
    return false;
  }
  return true;
};

// Load draft form
export const loadFormDraft = (draftId: string): FormCreationDraft | undefined => {
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_FORMS);
    const stored = storage.getItem(STORAGE_KEYS.DRAFT_FORMS);
    const drafts: FormCreationDraft[] = stored ? safeParseJSON(stored, []) : [];
    
    const draft = drafts.find(d => d.id === draftId);
    if (draft && validateFormDraft(draft)) {
      return draft;
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to load form draft:', error);
    return undefined;
  }
};

// Delete draft form
export const deleteFormDraft = (draftId: string): void => {
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_FORMS);
    const storageKey = STORAGE_KEYS.DRAFT_FORMS;
    
    let drafts: FormCreationDraft[] = [];
    try {
      const stored = storage.getItem(storageKey);
      drafts = stored ? safeParseJSON(stored, []) : [];
    } catch (e) {
      console.warn('Failed to parse existing drafts, nothing to delete');
      return;
    }
    
    const filtered = drafts.filter(d => d.id !== draftId);
    storage.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete form draft:', error);
  }
};

// Save response draft
export const saveResponseDraft = (draft: FormResponseDraft): void => {
  try {
    // Validate draft data
    if (!validateResponseDraft(draft)) {
      console.error('Invalid response draft data');
      return;
    }
    
    // Check storage quota
    const quota = checkStorageQuota();
    if (!quota.available) {
      console.warn('Storage limit exceeded, cannot save draft');
      return;
    }
    
    const storage = getStorage(STORAGE_KEYS.DRAFT_RESPONSES);
    const storageKey = STORAGE_KEYS.DRAFT_RESPONSES;
    
    let drafts: FormResponseDraft[] = [];
    try {
      const stored = storage.getItem(storageKey);
      drafts = stored ? safeParseJSON(stored, []) : [];
    } catch (e) {
      console.warn('Failed to parse existing drafts, starting fresh');
    }
    
    const existingIndex = drafts.findIndex(d => d.formId === draft.formId);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = { ...draft, updatedAt: Date.now() };
    } else {
      drafts.push({ ...draft, updatedAt: Date.now() });
    }
    
    storage.setItem(storageKey, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save response draft:', error);
  }
};

// Load response draft
export const loadResponseDraft = (formId: string): FormResponseDraft | undefined => {
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_RESPONSES);
    const stored = storage.getItem(STORAGE_KEYS.DRAFT_RESPONSES);
    const drafts: FormResponseDraft[] = stored ? safeParseJSON(stored, []) : [];
    
    const draft = drafts.find(d => d.formId === formId);
    if (draft && validateResponseDraft(draft)) {
      return draft;
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to load response draft:', error);
    return undefined;
  }
};

// Delete response draft
export const deleteResponseDraft = (formId: string): void => {
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_RESPONSES);
    const storageKey = STORAGE_KEYS.DRAFT_RESPONSES;
    
    let drafts: FormResponseDraft[] = [];
    try {
      const stored = storage.getItem(storageKey);
      drafts = stored ? safeParseJSON(stored, []) : [];
    } catch (e) {
      console.warn('Failed to parse existing drafts, nothing to delete');
      return;
    }
    
    const filtered = drafts.filter(d => d.formId !== formId);
    storage.setItem(storageKey, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete response draft:', error);
  }
};

// Clear old drafts (older than 30 days)
export const clearOldDrafts = (): void => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  // Clear old form drafts
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_FORMS);
    const storageKey = STORAGE_KEYS.DRAFT_FORMS;
    
    let drafts: FormCreationDraft[] = [];
    try {
      const stored = storage.getItem(storageKey);
      drafts = stored ? safeParseJSON(stored, []) : [];
    } catch (e) {
      console.warn('Failed to parse form drafts for cleanup');
      return;
    }
    
    const recentDrafts = drafts.filter(draft => draft.updatedAt > thirtyDaysAgo);
    storage.setItem(storageKey, JSON.stringify(recentDrafts));
  } catch (error) {
    console.error('Failed to clear old form drafts:', error);
  }
  
  // Clear old response drafts
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_RESPONSES);
    const storageKey = STORAGE_KEYS.DRAFT_RESPONSES;
    
    let drafts: FormResponseDraft[] = [];
    try {
      const stored = storage.getItem(storageKey);
      drafts = stored ? safeParseJSON(stored, []) : [];
    } catch (e) {
      console.warn('Failed to parse response drafts for cleanup');
      return;
    }
    
    const recentDrafts = drafts.filter(draft => draft.updatedAt > thirtyDaysAgo);
    storage.setItem(storageKey, JSON.stringify(recentDrafts));
  } catch (error) {
    console.error('Failed to clear old response drafts:', error);
  }
};

// Initialize draft cleanup on app load
export const initializeDraftCleanup = (): void => {
  // Clear old drafts when the app starts
  clearOldDrafts();
  
  // Set up periodic cleanup (daily)
  setInterval(clearOldDrafts, 24 * 60 * 60 * 1000);
};

// Get all form drafts
export const getAllFormDrafts = (): FormCreationDraft[] => {
  try {
    const storage = getStorage(STORAGE_KEYS.DRAFT_FORMS);
    const stored = storage.getItem(STORAGE_KEYS.DRAFT_FORMS);
    const drafts: FormCreationDraft[] = stored ? safeParseJSON(stored, []) : [];
    
    // Filter valid drafts and sort by updated date (newest first)
    return drafts
      .filter(draft => validateFormDraft(draft))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to get all form drafts:', error);
    return [];
  }
};