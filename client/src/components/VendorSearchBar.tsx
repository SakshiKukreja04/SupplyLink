import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, Filter, MapPin, Star, CheckCircle, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import VoiceSearchInput from './VoiceSearchInput';

interface Supplier {
  _id: string;
  businessName: string;
  businessType: string;
  productCategories: string[];
  location: {
    lat: number;
    lng: number;
  };
  rating: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  distance?: number;
}

interface VendorSearchBarProps {
  onSearch: (suppliers: Supplier[]) => void;
  onLoading: (loading: boolean) => void;
}

const VendorSearchBar: React.FC<VendorSearchBarProps> = ({ onSearch, onLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 10,
    minRating: 0,
    verifiedOnly: false, // Changed to false to show all suppliers initially
    categories: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { firebaseUser } = useAuth();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get user location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location access.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const searchSuppliers = async (keyword: string) => {
    if (!keyword.trim() || !userLocation) return;

    setLoading(true);
    onLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Get the current Firebase user from auth context
      const token = firebaseUser ? await firebaseUser.getIdToken() : null;

      // First, process the text through LibreTranslate for language detection and translation
      const translationResponse = await fetch('/api/search/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: keyword.trim(),
          language: 'auto'
        })
      });

      let processedKeyword = keyword.trim();
      let translationInfo = null;

      if (translationResponse.ok) {
        const translationData = await translationResponse.json();
        if (translationData.success) {
          processedKeyword = translationData.data.processedText;
          translationInfo = translationData.data;
          
          console.log('Translation info:', translationInfo);
          
          // Show translation feedback to user
          if (translationInfo.wasTranslated) {
            toast({
              title: "Translation Applied",
              description: `"${translationInfo.originalText}" → "${translationInfo.processedText}" (${translationInfo.detectedLanguage} to English)`,
            });
          } else if (translationInfo.processedText !== keyword.trim()) {
            // Show cleaning feedback even for English text
            toast({
              title: "Text Cleaned",
              description: `"${translationInfo.originalText}" → "${translationInfo.processedText}" (punctuation removed)`,
            });
          }
        }
      }

      // Now search for suppliers with the processed keyword
      const response = await fetch('/api/vendors/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keyword: processedKeyword,
          originalKeyword: keyword.trim(),
          lat: userLocation.lat,
          lng: userLocation.lng,
          maxDistance: filters.maxDistance,
          minRating: filters.minRating,
          verifiedOnly: filters.verifiedOnly,
          translationInfo
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Search response data:', data);
        
        setSuppliers(data.suppliers);
        onSearch(data.suppliers);
        
        // Show search results with detailed info
        const suppliersFound = data.suppliers?.length || 0;
        const searchInfo = data.searchInfo;
        
        let description = `Found ${suppliersFound} suppliers`;
        
        // Add translation info if available
        if (translationInfo?.wasTranslated) {
          description += ` (searched for "${processedKeyword}" from "${keyword.trim()}")`;
        }
        
        // Add detailed search info if available
        if (searchInfo) {
          if (searchInfo.stepResults) {
            // New detailed breakdown
            description += `\n📊 Total suppliers: ${searchInfo.stepResults.totalSuppliers || 0}`;
            description += `\n✅ Verified suppliers: ${searchInfo.stepResults.verifiedSuppliers || 0}`;
            description += `\n📦 Product matches: ${searchInfo.stepResults.productFiltered || 0}`;
            description += `\n📍 Within ${filters.maxDistance}km: ${searchInfo.stepResults.nearbySuppliers || 0}`;
            description += `\n⭐ Rating ≥ ${filters.minRating}: ${searchInfo.stepResults.ratedSuppliers || 0}`;
            description += `\n🎯 Final results: ${searchInfo.finalResults || 0}`;
          } else {
            // Fallback to old format
            description += `\n📊 Total suppliers: ${searchInfo.totalSuppliers || 0}`;
            description += `\n📍 Nearby suppliers: ${searchInfo.nearbySuppliers || 0}`;
            description += `\n⭐ Final results: ${searchInfo.finalResults || 0}`;
          }
        }
        
        console.log('🎯 Search alert description:', description);
        
        toast({
          title: suppliersFound > 0 ? "Search Complete" : "No Suppliers Found",
          description: description,
          variant: suppliersFound > 0 ? "default" : "destructive"
        });
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search suppliers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchSuppliers(value);
      }
    }, 500);
  };

  const handleVoiceSearch = (transcribedText: string) => {
    setSearchTerm(transcribedText);
    searchSuppliers(transcribedText);
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Re-search with new filters if there's a search term
    if (searchTerm.trim()) {
      searchSuppliers(searchTerm);
    }
  };

  const clearFilters = () => {
    setFilters({
      maxDistance: 10,
      minRating: 0,
      verifiedOnly: false, // Changed to false to show all suppliers
      categories: []
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Raw Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <VoiceSearchInput
                value={searchTerm}
                onChange={handleSearch}
                onTranscription={handleVoiceSearch}
                onSearch={searchSuppliers}
                placeholder="Search for products, categories, or suppliers..."
                disabled={loading}
              />
            </div>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">Search Filters</h4>
                    <Badge variant="secondary" className="text-xs">
                      {filters.verifiedOnly ? 'Verified Only' : 'All Suppliers'}
                    </Badge>
                  </div>
                  
                  {/* Distance Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">📍 Maximum Distance</Label>
                      <Badge variant="outline">{filters.maxDistance} km</Badge>
                    </div>
                    <Slider
                      value={[filters.maxDistance]}
                      onValueChange={([value]) => handleFilterChange({ maxDistance: value })}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 km</span>
                      <span>25 km</span>
                      <span>50 km</span>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">⭐ Minimum Rating</Label>
                      <Badge variant="outline">{filters.minRating}+</Badge>
                    </div>
                    <Slider
                      value={[filters.minRating]}
                      onValueChange={([value]) => handleFilterChange({ minRating: value })}
                      max={5}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Any</span>
                      <span>2.5+</span>
                      <span>5.0</span>
                    </div>
                  </div>

                  {/* Verified Only */}
                  <div className="space-y-3">
                    <Label className="font-medium">✅ Supplier Verification</Label>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="verified-only"
                        checked={filters.verifiedOnly}
                        onCheckedChange={(checked) => 
                          handleFilterChange({ verifiedOnly: checked as boolean })
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="verified-only" className="font-medium">
                          Verified suppliers only
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Show only suppliers with verified business profiles
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Filter Summary */}
                  <div className="p-3 bg-muted rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Current Filters:</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Distance:</span>
                        <span className="font-medium">≤ {filters.maxDistance} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-medium">≥ {filters.minRating}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verification:</span>
                        <span className="font-medium">{filters.verifiedOnly ? 'Verified Only' : 'All'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {userLocation ? (
              <span>
                Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            ) : (
              <span>Getting your location...</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results Summary */}
      {suppliers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Found {suppliers.length} suppliers</span>
                {filters.verifiedOnly && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Only
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Within {filters.maxDistance}km</span>
                {filters.minRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {filters.minRating}+ rating
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Searching suppliers...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorSearchBar; 