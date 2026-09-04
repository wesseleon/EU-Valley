import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const SYNC_INTERVAL = 15_000;

const migrateDefaults = (): StoredCompany[] => {
  const timestamp = new Date().toISOString();
  return defaultCompanies.map((company) => ({ ...company, createdAt: timestamp, updatedAt: timestamp }));
};

const readCache = () => {
  try {
    const companies = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const hiddenIds = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]');
    if (Array.isArray(companies) && Array.isArray(hiddenIds)) {
      return { companies: companies as StoredCompany[], hiddenIds: hiddenIds as string[] };
    }
  } catch {
    // Invalid cache is replaced with the bundled dataset.
  }
  return { companies: migrateDefaults(), hiddenIds: [] };
};

export const useCompanyStorage = () => {
  const [customCompanies, setCustomCompanies] = useState<StoredCompany[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const companiesRef = useRef<StoredCompany[]>([]);
  const hiddenRef = useRef(new Set<string>());
  const isSavingRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve(true));

  const applyLocalState = useCallback((companies: StoredCompany[], hidden: Set<string>) => {
    companiesRef.current = companies;
    hiddenRef.current = hidden;
    setCustomCompanies(companies);
    setHiddenIds(hidden);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hidden)));
  }, []);

  const fetchFromApi = useCallback(async () => {
    if (isSavingRef.current) return false;
    try {
      const response = await fetch('/api/companies', { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return false;
      const data = await response.json() as CompanyData;
      if (!Array.isArray(data.companies) || !Array.isArray(data.hiddenIds)) return false;
      if (data.companies.length === 0 && !data.lastUpdated) return false;
      applyLocalState(data.companies, new Set(data.hiddenIds));
      setLastSyncTime(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
      setSyncError(null);
      return true;
    } catch {
      return false;
    }
  }, [applyLocalState]);

  const saveSnapshot = useCallback(async (companies: StoredCompany[], hidden: Set<string>) => {
    isSavingRef.current = true;
    setIsSyncing(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies, hiddenIds: Array.from(hidden) }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Your admin session has expired.' : 'Changes could not be saved.');
      const result = await response.json() as { lastUpdated?: string };
      setLastSyncTime(result.lastUpdated ? new Date(result.lastUpdated) : new Date());
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Changes could not be saved.');
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const persist = useCallback((companies: StoredCompany[], hidden: Set<string>) => {
    applyLocalState(companies, hidden);
    saveQueueRef.current = saveQueueRef.current.then(() => saveSnapshot(companies, hidden));
    return saveQueueRef.current;
  }, [applyLocalState, saveSnapshot]);

  useEffect(() => {
    const load = async () => {
      if (!(await fetchFromApi())) {
        const cached = readCache();
        applyLocalState(cached.companies, new Set(cached.hiddenIds));
      }
      setIsLoaded(true);
    };
    void load();
  }, [applyLocalState, fetchFromApi]);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = window.setInterval(() => void fetchFromApi(), SYNC_INTERVAL);
    const refresh = () => void fetchFromApi();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [fetchFromApi, isLoaded]);

  const addCompany = useCallback(async (company: Omit<StoredCompany, 'id'>) => {
    const timestamp = new Date().toISOString();
    const newCompany: StoredCompany = {
      ...company,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const previous = companiesRef.current;
    const next = [...previous, newCompany];
    if (!(await persist(next, hiddenRef.current))) applyLocalState(previous, hiddenRef.current);
    return newCompany;
  }, [applyLocalState, persist]);

  const removeCompany = useCallback(async (id: string) => {
    const previousCompanies = companiesRef.current;
    const previousHidden = hiddenRef.current;
    const nextCompanies = previousCompanies.filter((company) => company.id !== id);
    const nextHidden = new Set(previousHidden);
    nextHidden.delete(id);
    if (!(await persist(nextCompanies, nextHidden))) applyLocalState(previousCompanies, previousHidden);
  }, [applyLocalState, persist]);

  const updateCompany = useCallback(async (id: string, updates: Partial<StoredCompany>) => {
    const previous = companiesRef.current;
    const next = previous.map((company) => {
      if (company.id !== id) return company;
      const changedFields = Object.keys(updates).filter((key) => updates[key as keyof StoredCompany] !== company[key as keyof StoredCompany]);
      return {
        ...company,
        ...updates,
        updatedAt: new Date().toISOString(),
        lastEditDetails: changedFields.length ? `Updated: ${changedFields.join(', ')}` : company.lastEditDetails,
      };
    });
    if (!(await persist(next, hiddenRef.current))) applyLocalState(previous, hiddenRef.current);
  }, [applyLocalState, persist]);

  const toggleVisibility = useCallback(async (id: string) => {
    const previous = hiddenRef.current;
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    if (!(await persist(companiesRef.current, next))) applyLocalState(companiesRef.current, previous);
  }, [applyLocalState, persist]);

  const isVisible = useCallback((id: string) => !hiddenIds.has(id), [hiddenIds]);
  const visibleCompanies = useMemo(
    () => customCompanies.filter((company) => !hiddenIds.has(company.id)),
    [customCompanies, hiddenIds],
  );

  return {
    allCompanies: customCompanies,
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
    syncError,
    syncNow: fetchFromApi,
  };
};