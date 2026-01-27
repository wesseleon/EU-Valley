import { useState, useEffect, useRef } from 'react';
import { Search, Globe, Linkedin, Globe2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/data/companies';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewType: 'country' | 'europe' | 'world';
  onViewTypeChange: (type: 'country' | 'europe' | 'world') => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  areaFilter: 'eu' | 'european-continent' | 'intercontinental' | 'all';
  onAreaFilterChange: (area: 'eu' | 'european-continent' | 'intercontinental' | 'all') => void;
  isCollapsed?: boolean;
}

export const SidebarHeader = ({
  searchQuery,
  onSearchChange,
  viewType,
  onViewTypeChange,
  selectedCountry,
  onCountryChange,
  areaFilter,
  onAreaFilterChange,
  isCollapsed = false,
}: SidebarHeaderProps) => {
  return (
    <div className="p-4 border-b border-border space-y-4">
      {/* Collapsible top section */}
      <div
        className={cn(
          "space-y-4 transition-all duration-300 overflow-hidden",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
        )}
      >
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors border-primary/20" 
            asChild
          >
            <a href="https://www.leeeon.studio/" target="_blank" rel="noopener noreferrer">
              <Globe className="w-4 h-4" aria-hidden="true" />
              Website
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-colors border-primary/20" 
            asChild
          >
            <a href="https://linkedin.com/in/wlb02/" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-4 h-4" aria-hidden="true" />
              LinkedIn
            </a>
          </Button>
        </nav>
      </div>

      {/* Always visible: Search and Filters */}
      <div className="space-y-4">
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
    </div>
  );
};
