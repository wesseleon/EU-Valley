import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useCompanyStorage } from '@/hooks/useCompanyStorage';
import { countries, categories } from '@/data/companies';
import { AdminPasswordGate } from '@/components/admin/AdminPasswordGate';

const AdminContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customCompanies, addCompany, removeCompany } = useCompanyStorage();
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    country: 'NL',
    street: '',
    description: '',
    website: '',
    logoUrl: '',
    category: 'Technology',
    latitude: 0,
    longitude: 0,
  });

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const geocodeAddress = async () => {
    if (!form.address && !form.city) {
      toast({
        title: 'Missing address',
        description: 'Please enter an address or city to geocode.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeocoding(true);
    
    try {
      const countryName = countries.find(c => c.code === form.country)?.name || '';
      const query = encodeURIComponent(`${form.address}, ${form.city}, ${countryName}`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          street: form.address || prev.street,
        }));
        toast({
          title: 'Location found',
          description: `Coordinates: ${result.lat}, ${result.lon}`,
        });
      } else {
        toast({
          title: 'Location not found',
          description: 'Could not find coordinates for this address. Try a more specific address.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Geocoding failed',
        description: 'Failed to fetch coordinates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }

    if (!form.latitude || !form.longitude) {
      toast({ 
        title: 'Coordinates required', 
        description: 'Please geocode the address first.',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const countryData = countries.find(c => c.code === form.country);
      
      // Use custom logo URL if provided, otherwise try Clearbit
      let logoUrl = form.logoUrl.trim();
      if (!logoUrl && form.website) {
        try {
          logoUrl = `https://logo.clearbit.com/${new URL(form.website.startsWith('http') ? form.website : `https://${form.website}`).hostname.replace('www.', '')}`;
        } catch {
          logoUrl = '';
        }
      }

      addCompany({
        name: form.name.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        country: countryData?.name || form.country,
        countryCode: form.country,
        city: form.city,
        street: form.street,
        state: '',
        description: form.description,
        website: form.website.startsWith('http') ? form.website : `https://${form.website}`,
        logoUrl,
        category: form.category,
      });

      toast({ title: 'Company added', description: `${form.name} has been added to the map.` });
      
      // Reset form
      setForm({
        name: '',
        address: '',
        city: '',
        country: 'NL',
        street: '',
        description: '',
        website: '',
        logoUrl: '',
        category: 'Technology',
        latitude: 0,
        longitude: 0,
      });
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'Failed to add company',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    removeCompany(id);
    toast({ title: 'Company removed', description: `${name} has been removed from the map.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Company</h1>
            <p className="text-muted-foreground">Add new companies to the EU Valley map</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Company
              </CardTitle>
              <CardDescription>Enter company details below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Acme Corp"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={form.country} onValueChange={(v) => handleInputChange('country', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g., Amsterdam"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="e.g., 123 Main Street"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={geocodeAddress}
                      disabled={isGeocoding}
                    >
                      {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </Button>
                  </div>
                  {form.latitude !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      📍 {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={form.category} onValueChange={(v) => handleInputChange('category', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="e.g., example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                  <Input
                    id="logoUrl"
                    value={form.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="e.g., https://example.com/logo.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-fetch from website
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief company description..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Custom Companies List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Custom Companies</CardTitle>
              <CardDescription>
                {customCompanies.length === 0 
                  ? 'No custom companies added yet' 
                  : `${customCompanies.length} custom ${customCompanies.length === 1 ? 'company' : 'companies'}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {customCompanies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Companies you add will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="w-8 h-8 rounded object-contain bg-background"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random`;
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{company.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {company.city}, {company.country}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company.id, company.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  return (
    <AdminPasswordGate>
      <AdminContent />
    </AdminPasswordGate>
  );
};

export default Admin;
