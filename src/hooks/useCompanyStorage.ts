import { useState, useEffect, useCallback } from 'react';
import { Company, companies as defaultCompanies } from '@/data/companies';

const STORAGE_KEY = 'eu-valley-companies';
const HIDDEN_KEY = 'eu-valley-hidden-companies';

export interface StoredCompany extends Company {
  createdAt?: string;
  updatedAt?: string;
  lastEditDetails?: string;
  alternativeFor?: string[];
}

export const useCompanyStorage = () => {
  const [companies, setCompanies] = useState<StoredCompany[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize companies from localStorage or default
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const hidden = localStorage.getItem(HIDDEN_KEY);
      
      if (stored) {
        setCompanies(JSON.parse(stored));
      } else {
        // First load: migrate default companies to localStorage
        const now = new Date().toISOString();
        const migratedCompanies: StoredCompany[] = defaultCompanies.map(c => ({
          ...c,
          createdAt: now,
          updatedAt: now,
          alternativeFor: [],
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedCompanies));
        setCompanies(migratedCompanies);
      }
      
      if (hidden) {
        setHiddenIds(new Set(JSON.parse(hidden)));
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies(defaultCompanies.map(c => ({ ...c })));
    }
    setIsLoaded(true);
  }, []);

  // Save companies to localStorage
  const saveCompanies = useCallback((updatedCompanies: StoredCompany[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCompanies));
      setCompanies(updatedCompanies);
    } catch (error) {
      console.error('Failed to save companies:', error);
    }
  }, []);

  // Save hidden IDs
  const saveHiddenIds = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]));
      setHiddenIds(ids);
    } catch (error) {
      console.error('Failed to save hidden IDs:', error);
    }
  }, []);

  // Add a new company
  const addCompany = useCallback((company: Omit<StoredCompany, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = company.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    const now = new Date().toISOString();
    
    const newCompany: StoredCompany = { 
      ...company, 
      id,
      createdAt: now,
      updatedAt: now,
      alternativeFor: company.alternativeFor || [],
    };
    
    // Check for duplicate
    if (companies.some(c => c.name.toLowerCase() === company.name.toLowerCase())) {
      throw new Error('A company with this name already exists');
    }
    
    const updated = [...companies, newCompany];
    saveCompanies(updated);
    return newCompany;
  }, [companies, saveCompanies]);

  // Remove a company
  const removeCompany = useCallback((id: string) => {
    const updated = companies.filter(c => c.id !== id);
    saveCompanies(updated);
  }, [companies, saveCompanies]);

  // Update a company
  const updateCompany = useCallback((id: string, updates: Partial<StoredCompany>, editDetails?: string) => {
    const now = new Date().toISOString();
    const updated = companies.map(c => 
      c.id === id ? { 
        ...c, 
        ...updates, 
        updatedAt: now,
        lastEditDetails: editDetails || `Updated: ${Object.keys(updates).join(', ')}`,
      } : c
    );
    saveCompanies(updated);
  }, [companies, saveCompanies]);

  // Toggle visibility
  const toggleVisibility = useCallback((id: string) => {
    const newHidden = new Set(hiddenIds);
    if (newHidden.has(id)) {
      newHidden.delete(id);
    } else {
      newHidden.add(id);
    }
    saveHiddenIds(newHidden);
  }, [hiddenIds, saveHiddenIds]);

  // Check if visible
  const isVisible = useCallback((id: string) => !hiddenIds.has(id), [hiddenIds]);

  // Get visible companies only
  const visibleCompanies = companies.filter(c => !hiddenIds.has(c.id));

  return {
    companies: visibleCompanies,
    allCompanies: companies,
    customCompanies: companies, // Backward compatibility
    hiddenIds,
    isLoaded,
    addCompany,
    removeCompany,
    updateCompany,
    toggleVisibility,
    isVisible,
  };
};
