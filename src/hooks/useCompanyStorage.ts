import { useState, useEffect, useCallback } from 'react';
import { Company, companies as defaultCompanies } from '@/data/companies';

const STORAGE_KEY = 'eu-valley-custom-companies';

export const useCompanyStorage = () => {
  const [customCompanies, setCustomCompanies] = useState<Company[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load custom companies from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomCompanies(parsed);
      }
    } catch (error) {
      console.error('Failed to load custom companies:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save custom companies to localStorage
  const saveCustomCompanies = useCallback((companies: Company[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
      setCustomCompanies(companies);
    } catch (error) {
      console.error('Failed to save custom companies:', error);
    }
  }, []);

  // Add a new company
  const addCompany = useCallback((company: Omit<Company, 'id'>) => {
    const id = company.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newCompany: Company = { ...company, id };
    
    // Check for duplicate
    const allCompanies = [...defaultCompanies, ...customCompanies];
    if (allCompanies.some(c => c.id === id || c.name.toLowerCase() === company.name.toLowerCase())) {
      throw new Error('A company with this name already exists');
    }
    
    const updated = [...customCompanies, newCompany];
    saveCustomCompanies(updated);
    return newCompany;
  }, [customCompanies, saveCustomCompanies]);

  // Remove a custom company
  const removeCompany = useCallback((id: string) => {
    const updated = customCompanies.filter(c => c.id !== id);
    saveCustomCompanies(updated);
  }, [customCompanies, saveCustomCompanies]);

  // Update a custom company
  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    const updated = customCompanies.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    saveCustomCompanies(updated);
  }, [customCompanies, saveCustomCompanies]);

  // Get all companies (default + custom)
  const allCompanies = [...defaultCompanies, ...customCompanies];

  return {
    companies: allCompanies,
    customCompanies,
    isLoaded,
    addCompany,
    removeCompany,
    updateCompany,
  };
};
