import { useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Company } from '@/data/companies';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { SidebarHeader } from './SidebarHeader';
import { CompanyDetail } from './CompanyDetail';
import { MobileSidebar } from './MobileSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  companies: Company[];
  selectedCompany: Company | null;
  onCompanySelect: (company: Company | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewType: 'country' | 'europe' | 'world';
  onViewTypeChange: (type: 'country' | 'europe' | 'world') => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  areaFilter: 'eu' | 'european-continent' | 'intercontinental' | 'all';
  onAreaFilterChange: (area: 'eu' | 'european-continent' | 'intercontinental' | 'all') => void;
}

export const Sidebar = ({
  companies,
  selectedCompany,
  onCompanySelect,
  searchQuery,
  onSearchChange,
  viewType,
  onViewTypeChange,
  selectedCountry,
  onCountryChange,
  areaFilter,
  onAreaFilterChange,
}: SidebarProps) => {
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const sortedCompanies = [...companies].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Handle scroll to collapse/expand header
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    
    if (scrollTop > 50 && !isHeaderCollapsed) {
      setIsHeaderCollapsed(true);
    } else if (scrollTop <= 10 && isHeaderCollapsed) {
      setIsHeaderCollapsed(false);
    }
  }, [isHeaderCollapsed]);

  // Show detailed view when a company is selected
  if (selectedCompany) {
    const DetailContent = (
      <CompanyDetail 
        company={selectedCompany as Company & { alternativeFor?: string[] }} 
        onBack={() => onCompanySelect(null)} 
      />
    );

    if (isMobile) {
      return <MobileSidebar>{DetailContent}</MobileSidebar>;
    }
    return DetailContent;
  }

  const SidebarContent = (
    <div className="w-full md:w-96 bg-card backdrop-blur-lg md:border-r md:border-border flex flex-col h-full">
      {/* Header with collapsible top section */}
      <SidebarHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        viewType={viewType}
        onViewTypeChange={onViewTypeChange}
        selectedCountry={selectedCountry}
        onCountryChange={onCountryChange}
        areaFilter={areaFilter}
        onAreaFilterChange={onAreaFilterChange}
        isCollapsed={isHeaderCollapsed}
      />

      {/* Company List */}
      <ScrollArea 
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        <ul className="p-2 space-y-1" role="list">
          {sortedCompanies.map((company) => (
            <li key={company.id}>
              <button
                onClick={() => onCompanySelect(company)}
                onMouseEnter={() => setHoveredCompany(company.id)}
                onMouseLeave={() => setHoveredCompany(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 text-left cursor-pointer ${
                  hoveredCompany === company.id
                    ? 'bg-primary/10'
                    : 'hover:bg-primary/5'
                }`}
                aria-label={`View ${company.name} details`}
              >
                <figure className={`bg-background rounded-lg border border-border overflow-hidden flex items-center justify-center shrink-0 p-0.5 transition-transform duration-200 ${
                  hoveredCompany === company.id ? 'scale-110' : 'scale-100'
                }`} style={{ width: 44, height: 44 }}>
                  <img 
                    src={company.logoUrl} 
                    alt=""
                    className="w-9 h-9 object-contain rounded-md"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=32&background=random`;
                    }}
                  />
                </figure>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{company.category}</p>
                </div>
                <span className="shrink-0" role="img" aria-label={`${company.country} flag`}>
                  <CountryFlag countryCode={company.countryCode} size="m" />
                </span>
              </button>
            </li>
          ))}

          {sortedCompanies.length === 0 && (
            <li className="p-8 text-center text-muted-foreground">
              No companies found
            </li>
          )}
        </ul>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {sortedCompanies.length} companies
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return <MobileSidebar>{SidebarContent}</MobileSidebar>;
  }

  return SidebarContent;
};
