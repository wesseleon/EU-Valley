import { useState, useEffect, useCallback, useMemo } from 'react';
import { Company, companies as defaultCompanies } from '@/data/companies';

export interface StoredCompany extends Company {
  alternativeFor?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastEditDetails?: string;
}

interface CompanyData {
  companies: StoredCompany[];
  hiddenIds: string[];
  lastUpdated: string | null;
}

const STORAGE_KEY = 'eu-valley-companies';
const HIDDEN_KEY = 'eu-valley-hidden';

// Use the production URL for the API since Vercel serverless functions 
// only work on Vercel deployments, not in Lovable preview
const getApiUrl = () => {
  // Production Vercel URL - this is where the API is deployed
  const productionApiUrl = 'https://eu-valley.lovable.app/api/companies';
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If we're on the production domain, use relative URL
    if (hostname === 'eu-valley.lovable.app' || hostname.includes('vercel.app')) {
      return '/api/companies';
    }
  }
  
  // For preview/development, call the production API directly
  return productionApiUrl;
};

// Helper to migrate default companies
const migrateDefaultCompanies = (): StoredCompany[] => {
  return defaultCompanies.map(company => ({
    ...company,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

export const useCompanyStorage = () => {
  const [customCompanies, setCustomCompanies] = useState<StoredCompany[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fetch data from API
  const fetchFromApi = useCallback(async () => {
    const apiUrl = getApiUrl();
    
    try {
      console.log('Fetching companies from API...');
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data: CompanyData = await response.json();
      console.log('API response:', { 
        companiesCount: data.companies?.length || 0, 
        hiddenCount: data.hiddenIds?.length || 0,
        lastUpdated: data.lastUpdated 
      });
      
      if (data.companies && data.companies.length > 0) {
        setCustomCompanies(data.companies);
        setHiddenIds(new Set(data.hiddenIds || []));
        
        // Also update localStorage as cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.companies));
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(data.hiddenIds || []));
        
        if (data.lastUpdated) {
          setLastSyncTime(new Date(data.lastUpdated));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to fetch from API, using local data:', error);
      return false;
    }
  }, []);

  // Save data to API
  const saveToApi = useCallback(async (companies: StoredCompany[], hidden: string[]) => {
    const apiUrl = getApiUrl();
    
    setIsSyncing(true);
    try {
      console.log('Saving companies to API...', { companiesCount: companies.length, hiddenCount: hidden.length });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies, hiddenIds: hidden }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API save failed:', response.status, errorText);
        throw new Error(`Failed to save: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API save successful:', result);
      
      if (result.lastUpdated) {
        setLastSyncTime(new Date(result.lastUpdated));
      }
      return true;
    } catch (error) {
      console.error('Failed to save to API:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      // First, try to load from API
      const apiSuccess = await fetchFromApi();
      
      if (!apiSuccess) {
        // Fall back to localStorage
        const storedData = localStorage.getItem(STORAGE_KEY);
        const storedHidden = localStorage.getItem(HIDDEN_KEY);
        
        if (storedData) {
          try {
            setCustomCompanies(JSON.parse(storedData));
          } catch {
            // Invalid data, migrate defaults
            const migrated = migrateDefaultCompanies();
            setCustomCompanies(migrated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          }
        } else {
          // First time - migrate default companies
          const migrated = migrateDefaultCompanies();
          setCustomCompanies(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          
          // Also save to API
          await saveToApi(migrated, []);
        }
        
        if (storedHidden) {
          try {
            setHiddenIds(new Set(JSON.parse(storedHidden)));
          } catch {
            setHiddenIds(new Set());
          }
        }
      }
      
      setIsLoaded(true);
    };

    loadData();
  }, [fetchFromApi, saveToApi]);

  // Save whenever data changes (after initial load)
  const persistData = useCallback(async (companies: StoredCompany[], hidden: Set<string>) => {
    const hiddenArray = Array.from(hidden);
    
    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenArray));
    
    // Save to API
    await saveToApi(companies, hiddenArray);
  }, [saveToApi]);

  const addCompany = useCallback((company: Omit<StoredCompany, 'id'>) => {
    const newCompany: StoredCompany = {
      ...company,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setCustomCompanies(prev => {
      const updated = [...prev, newCompany];
      persistData(updated, hiddenIds);
      return updated;
    });
    
    return newCompany;
  }, [hiddenIds, persistData]);

  const removeCompany = useCallback((id: string) => {
    setCustomCompanies(prev => {
      const updated = prev.filter(c => c.id !== id);
      persistData(updated, hiddenIds);
      return updated;
    });
    
    // Also remove from hidden if it was hidden
    setHiddenIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, [hiddenIds, persistData]);

  const updateCompany = useCallback((id: string, updates: Partial<StoredCompany>) => {
    setCustomCompanies(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          const changedFields = Object.keys(updates).filter(key => 
            (updates as any)[key] !== (c as any)[key]
          );
          return {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString(),
            lastEditDetails: changedFields.length > 0 
              ? `Updated: ${changedFields.join(', ')}`
              : c.lastEditDetails,
          };
        }
        return c;
      });
      persistData(updated, hiddenIds);
      return updated;
    });
  }, [hiddenIds, persistData]);

  const toggleVisibility = useCallback((id: string) => {
    setHiddenIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      persistData(customCompanies, updated);
      return updated;
    });
  }, [customCompanies, persistData]);

  const isVisible = useCallback((id: string) => {
    return !hiddenIds.has(id);
  }, [hiddenIds]);

  // Combine all companies and filter visible
  const allCompanies = useMemo(() => customCompanies, [customCompanies]);
  
  const visibleCompanies = useMemo(() => 
    customCompanies.filter(c => !hiddenIds.has(c.id)),
    [customCompanies, hiddenIds]
  );

  // Manual sync function
  const syncNow = useCallback(async () => {
    await fetchFromApi();
  }, [fetchFromApi]);

  return {
    allCompanies,
    companies: visibleCompanies,
    visibleCompanies,
    customCompanies,
    hiddenIds,
    addCompany,
    removeCompany,
    updateCompany,
    toggleVisibility,
    isVisible,
    isLoaded,
    isSyncing,
    lastSyncTime,
    syncNow,
  };
};
