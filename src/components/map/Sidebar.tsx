import { useState } from 'react';
import { Search, Globe, MapPin, ExternalLink, ArrowLeft, Linkedin, Globe2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Company, countries } from '@/data/companies';

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
      <div className="w-96 bg-card/95 backdrop-blur-lg border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <Button 
            variant="ghost" 
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => onCompanySelect(null)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to list
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-background rounded-xl border border-border overflow-hidden flex items-center justify-center">
                <img 
                  src={selectedCompany.logoUrl} 
                  alt={selectedCompany.name}
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/80?text=${selectedCompany.name.charAt(0)}`;
                  }}
                />
              </div>
            </div>

            {/* Name and Category */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{selectedCompany.name}</h2>
              <Badge variant="secondary" className="text-sm">
                {selectedCompany.category}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed">
              {selectedCompany.description}
            </p>

            {/* Address */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Address
              </h3>
              <p className="text-sm text-muted-foreground pl-6">
                {selectedCompany.street && `${selectedCompany.street}, `}
                {selectedCompany.city}, {selectedCompany.country}
              </p>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Website
              </h3>
              <a 
                href={selectedCompany.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 pl-6 transition-colors"
              >
                {selectedCompany.website.replace('https://www.', '').replace('https://', '').replace(/\/$/, '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </ScrollArea>
      </div>
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer">
              <Globe className="w-4 h-4" />
              Website
            </a>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
          </Button>
        </div>

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
        <div className="p-2 space-y-1">
          {sortedCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => onCompanySelect(company)}
              onMouseEnter={() => setHoveredCompany(company.id)}
              onMouseLeave={() => setHoveredCompany(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                hoveredCompany === company.id
                  ? 'bg-primary/10 border-primary/20'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="w-10 h-10 bg-background rounded-lg border border-border overflow-hidden flex items-center justify-center shrink-0">
                <img 
                  src={company.logoUrl} 
                  alt={company.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/32?text=${company.name.charAt(0)}`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{company.name}</p>
                <p className="text-xs text-muted-foreground truncate">{company.category}</p>
              </div>
            </button>
          ))}

          {sortedCompanies.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No companies found
            </div>
          )}
        </div>
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
