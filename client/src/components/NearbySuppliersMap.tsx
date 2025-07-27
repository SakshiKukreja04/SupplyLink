import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Package, Star, Phone, Mail, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import OrderPlacementModal from './OrderPlacementModal';
import socketManager from '@/utils/socket';

interface Supplier {
  _id: string;
  firebaseUid: string;
  businessName: string;
  businessType: string;
  category: string;
  productCategories: string[];
  location: {
    coordinates: [number, number];
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  rating: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  availableItems: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    unit: string;
    category: string;
    isAvailable: boolean;
    minimumOrderQuantity: number;
    deliveryTime: number;
  }>;
  phone: string;
  email: string;
  distance: number;
}

interface NearbySuppliersMapProps {
  onSupplierSelect?: (supplier: Supplier) => void;
}

const NearbySuppliersMap: React.FC<NearbySuppliersMapProps> = ({ onSupplierSelect }) => {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [vendorLocation, setVendorLocation] = useState<{
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  } | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState<Supplier | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    maxDistance: 10, // km
    minRating: 1,
    verifiedOnly: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  const fetchNearbySuppliers = useCallback(async () => {
    if (!firebaseUser?.uid) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/suppliers/nearby?vendorId=${firebaseUser.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers);
        setVendorLocation(data.vendorLocation);
        
        if (data.count === 0) {
          toast({
            title: "No Suppliers Found",
            description: `No suppliers found within ${data.searchRadius}km of your location.`,
          });
        } else {
          toast({
            title: "Suppliers Found",
            description: `Found ${data.count} suppliers within ${data.searchRadius}km of your location.`,
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch nearby suppliers');
      }
    } catch (err) {
      console.error('Error fetching nearby suppliers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby suppliers');
      toast({
        title: "Error",
        description: "Failed to fetch nearby suppliers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, toast]);

  useEffect(() => {
    fetchNearbySuppliers();
  }, [firebaseUser?.uid, fetchNearbySuppliers]);

  // Function to fetch updated rating for a specific supplier
  const fetchUpdatedSupplierRating = useCallback(async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/reviews`);
      
      if (response.ok) {
        const reviewsData = await response.json();
        
        if (reviewsData.statistics) {
          // Update the supplier's rating in the local state
          setSuppliers(prevSuppliers => 
            prevSuppliers.map(supplier => 
              supplier._id === supplierId 
                ? {
                    ...supplier,
                    rating: {
                      average: reviewsData.statistics.averageRating || 0,
                      count: reviewsData.statistics.totalReviews || 0
                    }
                  }
                : supplier
            )
          );
          
          console.log(`Updated rating for supplier ${supplierId}:`, reviewsData.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching updated supplier rating:', error);
    }
  }, []);

  // Apply filters to suppliers
  useEffect(() => {
    const filtered = suppliers.filter(supplier => {
      // Distance filter
      if (supplier.distance > filters.maxDistance) {
        return false;
      }
      
      // Rating filter
      if (supplier.rating.average < filters.minRating) {
        return false;
      }
      
      // Verified filter
      if (filters.verifiedOnly && !supplier.isVerified) {
        return false;
      }
      
      return true;
    });
    
    setFilteredSuppliers(filtered);
  }, [suppliers, filters]);

  // Fetch updated ratings for all suppliers after they're loaded
  useEffect(() => {
    if (suppliers.length > 0) {
      suppliers.forEach(supplier => {
        fetchUpdatedSupplierRating(supplier._id);
      });
    }
  }, [suppliers.length]);

  // Socket listener for real-time rating updates
  useEffect(() => {
    const socket = socketManager.connect();
    
    // Listen for new reviews to update supplier ratings
    socket.on('review_submitted', (data: any) => {
      console.log('Review submitted, updating supplier ratings:', data);
      
      if (data.review?.supplierId) {
        // Update the supplier's rating in the local state
        setSuppliers(prevSuppliers => 
          prevSuppliers.map(supplier => {
            if (supplier._id === data.review.supplierId) {
              // Calculate new average rating and count
              const currentTotal = supplier.rating.average * supplier.rating.count;
              const newTotal = currentTotal + data.review.rating;
              const newCount = supplier.rating.count + 1;
              const newAverage = newTotal / newCount;
              
              return {
                ...supplier,
                rating: {
                  average: Math.round(newAverage * 10) / 10, // Round to 1 decimal place
                  count: newCount
                }
              };
            }
            return supplier;
          })
        );

        console.log(`Updated rating for supplier ${data.review.supplierId} in real-time`);
      }
    });

    return () => {
      socket.off('review_submitted');
    };
  }, []);

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    if (onSupplierSelect) {
      onSupplierSelect(supplier);
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Nearby Suppliers
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Truck className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchNearbySuppliers}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium mb-4">Search Filters</h3>
            <div className="space-y-4">
              {/* Distance Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Distance: {filters.maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Rating: {filters.minRating}+
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Verified Filter */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="verifiedOnly"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="verifiedOnly" className="ml-2 text-sm font-medium">
                  Verified suppliers only
                </label>
              </div>
              
              {/* Clear Filters */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilters({ maxDistance: 10, minRating: 1, verifiedOnly: false })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Finding nearby suppliers...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-600 bg-red-50 p-4 rounded-md">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchNearbySuppliers}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && suppliers.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No suppliers found nearby</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure you have set your location to find nearby suppliers
              </p>
            </div>
          )}

          {!loading && !error && suppliers.length > 0 && (
            <>
              {/* Filter Summary */}
              {showFilters && (
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <p className="text-sm font-medium text-blue-800">Active Filters</p>
                  <p className="text-sm text-blue-600">
                    Distance: ≤{filters.maxDistance}km | Rating: ≥{filters.minRating}+ | 
                    {filters.verifiedOnly ? ' Verified only' : ' All suppliers'} | 
                    Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                  </p>
                </div>
              )}

              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No suppliers match your filters</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filter criteria
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFilters({ maxDistance: 10, minRating: 1, verifiedOnly: false })}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
            <div className="space-y-4">
              {vendorLocation && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-800">Your Location</p>
                  <p className="text-sm text-blue-600">
                    {vendorLocation.address || `${vendorLocation.city}, ${vendorLocation.state}`}
                  </p>
                </div>
              )}

              <div className="grid gap-4">
                {filteredSuppliers.map((supplier) => (
                  <Card 
                    key={supplier._id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedSupplier?._id === supplier._id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleSupplierSelect(supplier)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{supplier.businessName}</h3>
                            {supplier.isVerified && (
                              <Badge variant="default" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {supplier.businessType}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {formatDistance(supplier.distance)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {supplier.rating.average.toFixed(1)} ({supplier.rating.count})
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {supplier.availableItems.length} items
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {supplier.productCategories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {supplier.productCategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{supplier.productCategories.length - 3} more
                              </Badge>
                            )}
                          </div>

                          {supplier.availableItems.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Available Items:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {supplier.availableItems.slice(0, 4).map((item) => (
                                  <div key={item._id} className="bg-gray-50 p-2 rounded text-xs">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-muted-foreground">
                                      {formatPrice(item.price)}/{item.unit}
                                    </div>
                                    <div className="text-muted-foreground">
                                      Min: {item.minimumOrderQuantity} {item.unit}
                                    </div>
                                  </div>
                                ))}
                                {supplier.availableItems.length > 4 && (
                                  <div className="bg-gray-50 p-2 rounded text-xs text-center text-muted-foreground">
                                    +{supplier.availableItems.length - 4} more items
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Truck className="w-3 h-3 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NearbySuppliersMap; 