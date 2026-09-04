import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Company } from '@/data/companies';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { createFallbackImage } from '@/lib/createFallbackImage';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface CompanyDetailProps {
  company: Company & { alternativeFor?: string[] };
  onBack: () => void;
}

export const CompanyDetail = ({ company, onBack }: CompanyDetailProps) => {
  return (
    <nav className="w-full md:w-96 bg-card/95 backdrop-blur-lg md:border-r border-border flex flex-col h-full font-sans" aria-label="Company details">
      <header className="p-4 border-b border-border">
        <Button 
          variant="outline" 
          className="gap-2 bg-background text-foreground border-border hover:bg-foreground hover:text-background transition-colors"
          onClick={onBack}
        >
          <PixelIcon name="arrow-left" />
          Back to list
        </Button>
      </header>
      
      <ScrollArea className="min-h-0 flex-1">
        <article className="p-6 space-y-6">
          {/* Logo */}
          <figure className="flex justify-center">
            <div className="w-24 h-24 bg-background rounded-xl border border-border overflow-hidden flex items-center justify-center p-1">
              <img
                src={company.logoUrl || createFallbackImage(company.name)}
                alt={`${company.name} logo`}
                className="w-20 h-20 object-contain rounded-lg"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = createFallbackImage(company.name);
                }}
              />
            </div>
          </figure>

          {/* Name and Category */}
          <header className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <Badge variant="secondary" className="text-sm">
              {company.category}
            </Badge>
          </header>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {company.description}
          </p>

          {/* Address */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
               <PixelIcon name="location-pin" className="text-primary" />
              Address
            </h2>
            <address className="text-sm text-muted-foreground pl-6 not-italic">
              {company.street && `${company.street}, `}
              {company.city}, {company.country}
            </address>
          </section>

          {/* Website */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
               <PixelIcon name="globe" className="text-primary" />
              Website
            </h2>
            <a 
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1 pl-6 transition-colors"
            >
              {company.website.replace('https://www.', '').replace('https://', '').replace(/\/$/, '')}
               <PixelIcon name="external-link" />
            </a>
          </section>

          {/* Country */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
               <PixelIcon name="globe-americas" className="text-primary" />
              Country
            </h2>
            <div className="pl-6">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
                <CountryFlag countryCode={company.countryCode} size="L" />
                <span className="text-sm font-semibold text-foreground">
                  {company.country}
                </span>
              </div>
            </div>
          </section>

          {/* Alternative For */}
          {company.alternativeFor && company.alternativeFor.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                 <PixelIcon name="refresh" className="text-primary" />
                 Alternative for
              </h2>
              <div className="pl-6 flex flex-wrap gap-2">
                {company.alternativeFor.map((competitor) => (
                  <Badge 
                    key={competitor} 
                    variant="outline" 
                    className="bg-destructive/5 border-destructive/20 text-foreground"
                  >
                    {competitor}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Non-European competitors this company can replace
              </p>
            </section>
          )}
        </article>
      </ScrollArea>
    </nav>
  );
};
