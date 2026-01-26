import { useState, memo, useCallback } from 'react';
import { Search, Globe, MapPin, ExternalLink, ArrowLeft, Linkedin, Globe2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Company, countries } from '@/data/companies';
import { countryCodeToFlag } from '@/lib/countryFlags';

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

  const sortedCompanies = [...companies].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  if (selectedCompany) {
    return (
      <nav className="w-96 bg-card/95 backdrop-blur-lg border-r border-border flex flex-col h-full font-sans" aria-label="Company details">
        <header className="p-4 border-b border-border">
          <Button 
            variant="secondary" 
            className="gap-2 hover:bg-secondary/80 transition-colors"
            onClick={() => onCompanySelect(null)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </Button>
        </header>
        
        <ScrollArea className="flex-1">
          <article className="p-6 space-y-6">
            {/* Logo */}
            <figure className="flex justify-center">
              <div className="w-24 h-24 bg-background rounded-xl border border-border overflow-hidden flex items-center justify-center">
                <img 
                  src={selectedCompany.logoUrl} 
                  alt={`${selectedCompany.name} logo`}
                  className="w-20 h-20 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCompany.name)}&size=80&background=random`;
                  }}
                />
              </div>
            </figure>

            {/* Name and Category */}
            <header className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{selectedCompany.name}</h1>
              <Badge variant="secondary" className="text-sm">
                {selectedCompany.category}
              </Badge>
            </header>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed">
              {selectedCompany.description}
            </p>

            {/* Address */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                Address
              </h2>
              <address className="text-sm text-muted-foreground pl-6 not-italic">
                {selectedCompany.street && `${selectedCompany.street}, `}
                {selectedCompany.city}, {selectedCompany.country}
              </address>
            </section>

            {/* Website */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
                Website
              </h2>
              <a 
                href={selectedCompany.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1 pl-6 transition-colors"
              >
                {selectedCompany.website.replace('https://www.', '').replace('https://', '').replace(/\/$/, '')}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </section>

            {/* Country */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary" aria-hidden="true" />
                Country
              </h2>
              <div className="pl-6">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                  <span className="text-xl" role="img" aria-label={`${selectedCompany.country} flag`}>
                    {countryCodeToFlag(selectedCompany.countryCode)}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {selectedCompany.country}
                  </span>
                </div>
              </div>
            </section>
          </article>
        </ScrollArea>
      </nav>
    );
  }

  return (
    <div className="w-96 bg-card/95 backdrop-blur-lg border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-4">
        {/* Cover Image */}
        <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/10">
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe2 className="w-16 h-16 text-primary/30" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">EU Valley</h1>
          <p className="text-sm text-muted-foreground">
            Discover innovative companies across Europe and beyond
          </p>
        </div>

        {/* Socials */}
        <nav className="flex gap-2" aria-label="Social links">
          <Button variant="outline" size="sm" className="gap-2 hover:bg-muted transition-colors" asChild>
            <a href="https://www.leeeon.studio/" target="_blank" rel="noopener noreferrer">
              <Globe className="w-4 h-4" aria-hidden="true" />
              Website
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 hover:bg-muted transition-colors" asChild>
            <a href="https://linkedin.com/in/wlb02/" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4" aria-hidden="true" />
              LinkedIn
            </a>
          </Button>
        </nav>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Filters */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={viewType} onValueChange={(v) => onViewTypeChange(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="world">World</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="country">Country</SelectItem>
            </SelectContent>
          </Select>

          {viewType === 'country' ? (
            <Select value={selectedCountry} onValueChange={onCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={areaFilter} onValueChange={(v) => onAreaFilterChange(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="eu">European Union</SelectItem>
                <SelectItem value="european-continent">European Continent</SelectItem>
                <SelectItem value="intercontinental">Intercontinental Europe</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Company List */}
      <ScrollArea className="flex-1">
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
                    : 'hover:bg-muted/50'
                }`}
                aria-label={`View ${company.name} details`}
              >
                <figure className="w-10 h-10 bg-background rounded-lg border border-border overflow-hidden flex items-center justify-center shrink-0">
                  <img 
                    src={company.logoUrl} 
                    alt=""
                    className="w-8 h-8 object-contain"
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
                <span className="text-lg shrink-0" role="img" aria-label={`${company.country} flag`}>
                  {countryCodeToFlag(company.countryCode)}
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
};
