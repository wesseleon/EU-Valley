import { useState, useMemo, useCallback } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { Sidebar } from '@/components/map/Sidebar';
import { 
  companies as allCompanies, 
  countries, 
  euCountries, 
  europeanContinent, 
  intercontinentalEurope,
  Company 
} from '@/data/companies';

const Index = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'country' | 'europe' | 'world'>('europe');
  const [selectedCountry, setSelectedCountry] = useState('NL');
  const [areaFilter, setAreaFilter] = useState<'eu' | 'european-continent' | 'intercontinental' | 'all'>('all');

  const filteredCompanies = useMemo(() => {
    let filtered = allCompanies;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.city.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query)
      );
    }

    // Filter by view type
    if (viewType === 'country') {
      filtered = filtered.filter((c) => c.countryCode === selectedCountry);
    } else if (viewType !== 'world') {
      // Filter by area
      if (areaFilter === 'eu') {
        filtered = filtered.filter((c) => euCountries.includes(c.countryCode));
      } else if (areaFilter === 'european-continent') {
        filtered = filtered.filter((c) => europeanContinent.includes(c.countryCode));
      } else if (areaFilter === 'intercontinental') {
        filtered = filtered.filter((c) => intercontinentalEurope.includes(c.countryCode));
      }
    }

    return filtered;
  }, [searchQuery, viewType, selectedCountry, areaFilter]);

  const viewCenter = useMemo((): [number, number] => {
    if (viewType === 'country') {
      const country = countries.find((c) => c.code === selectedCountry);
      return country?.center || [4.9, 52.37];
    } else if (viewType === 'europe') {
      return [10, 50];
    }
    return [0, 30];
  }, [viewType, selectedCountry]);

  const viewZoom = useMemo(() => {
    if (viewType === 'country') {
      return 7;
    } else if (viewType === 'europe') {
      return 4;
    }
    return 2;
  }, [viewType]);

  const handleCompanySelect = useCallback((company: Company | null) => {
    setSelectedCompany(company);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        companies={filteredCompanies}
        selectedCompany={selectedCompany}
        onCompanySelect={handleCompanySelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewType={viewType}
        onViewTypeChange={setViewType}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        areaFilter={areaFilter}
        onAreaFilterChange={setAreaFilter}
      />
      <div className="flex-1 relative">
        <MapContainer
          companies={filteredCompanies}
          selectedCompany={selectedCompany}
          onCompanySelect={handleCompanySelect}
          viewCenter={viewCenter}
          viewZoom={viewZoom}
        />
      </div>
    </div>
  );
};

export default Index;
