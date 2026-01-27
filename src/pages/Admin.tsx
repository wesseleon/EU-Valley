import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MapPin, Loader2, Search, Pencil, X, Check, Eye, EyeOff, LogOut, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCompanyStorage, StoredCompany } from '@/hooks/useCompanyStorage';
import { countries, categories } from '@/data/companies';
import { countryCodeToFlag } from '@/lib/countryFlags';
import { AdminPasswordGate, useAdminLogout } from '@/components/admin/AdminPasswordGate';

const AdminContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const logout = useAdminLogout();
  const { allCompanies, addCompany, removeCompany, updateCompany, toggleVisibility, isVisible } = useCompanyStorage();
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  
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
    alternativeFor: '',
  });

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    const sorted = [...allCompanies].sort((a, b) => a.name.localeCompare(b.name));
    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase();
    return sorted.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.city.toLowerCase().includes(query) ||
      c.country.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
    );
  }, [allCompanies, searchQuery]);

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
    } catch {
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
        alternativeFor: form.alternativeFor.split(',').map(s => s.trim()).filter(Boolean),
      });

      toast({ title: 'Company added', description: `${form.name} has been added to the map.` });
      
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
        alternativeFor: '',
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

  const startEditing = (company: StoredCompany) => {
    setEditingId(company.id);
    setEditForm({
      name: company.name,
      city: company.city,
      category: company.category,
      website: company.website,
      description: company.description,
      logoUrl: company.logoUrl,
      alternativeFor: (company.alternativeFor || []).join(', '),
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      lastEditDetails: company.lastEditDetails,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = (id: string) => {
    const alternativeForArray = editForm.alternativeFor
      ? editForm.alternativeFor.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    
    updateCompany(id, {
      name: editForm.name,
      city: editForm.city,
      category: editForm.category,
      website: editForm.website,
      description: editForm.description,
      logoUrl: editForm.logoUrl,
      alternativeFor: alternativeForArray,
    });
    toast({ title: 'Company updated', description: `${editForm.name} has been updated.` });
    setEditingId(null);
    setEditForm({});
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/')} className="hover:bg-primary/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage companies on the EU Valley map</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </header>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">All Companies</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>

          {/* Company List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Companies ({allCompanies.length})</CardTitle>
                <CardDescription>
                  All companies can be edited, hidden, or removed.
                </CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, city, country, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredCompanies.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No companies found</p>
                      </div>
                    ) : (
                      filteredCompanies.map((company) => (
                        <div
                          key={company.id}
                          className={`flex items-center justify-between p-3 rounded-lg border bg-card transition-colors ${
                            !isVisible(company.id) ? 'opacity-50' : 'hover:bg-primary/5'
                          }`}
                        >
                          {editingId === company.id ? (
                            // Edit mode
                            <div className="flex-1 space-y-3">
                              {/* Timestamps */}
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-primary/5 p-2 rounded-lg">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Created: {formatDate(editForm.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last edited: {formatDate(editForm.updatedAt)}
                                </div>
                                {editForm.lastEditDetails && (
                                  <div className="w-full text-xs">
                                    Last change: {editForm.lastEditDetails}
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={editForm.name}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Company name"
                                />
                                <Input
                                  value={editForm.city}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                                  placeholder="City"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select 
                                  value={editForm.category} 
                                  onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={editForm.website}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                                  placeholder="Website"
                                />
                              </div>
                              <Input
                                value={editForm.logoUrl}
                                onChange={(e) => setEditForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder="Logo URL"
                              />
                              <Input
                                value={editForm.alternativeFor}
                                onChange={(e) => setEditForm(prev => ({ ...prev, alternativeFor: e.target.value }))}
                                placeholder="Alternative for (comma-separated, e.g., Google, Meta)"
                              />
                              <Textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveEditing(company.id)} className="gap-1">
                                  <Check className="w-3 h-3" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1">
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <img
                                  src={company.logoUrl}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-contain bg-background border border-border"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random`;
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{company.name}</p>
                                    {!isVisible(company.id) && (
                                      <Badge variant="outline" className="text-xs shrink-0">Hidden</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {company.city}, {company.country} • {company.category}
                                  </p>
                                </div>
                                <span className="text-xl shrink-0" role="img" aria-label={`${company.country} flag`}>
                                  {countryCodeToFlag(company.countryCode)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {/* Visibility toggle */}
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={isVisible(company.id)}
                                    onCheckedChange={() => toggleVisibility(company.id)}
                                    aria-label={`Toggle ${company.name} visibility`}
                                  />
                                  {isVisible(company.id) ? (
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(company)}
                                  className="hover:bg-primary/10 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(company.id, company.name)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add New Tab */}
          <TabsContent value="add">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Company
                </CardTitle>
                <CardDescription>Enter company details below to add it to the map</CardDescription>
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
                        className="hover:bg-primary/10 transition-colors"
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
                    <Label htmlFor="alternativeFor">Alternative For (optional)</Label>
                    <Input
                      id="alternativeFor"
                      value={form.alternativeFor}
                      onChange={(e) => handleInputChange('alternativeFor', e.target.value)}
                      placeholder="e.g., Google, Amazon, Meta (comma-separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Non-European competitors this company can replace
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
          </TabsContent>
        </Tabs>
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
