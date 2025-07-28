import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Phone, Mail, Building, Package, Plus, Minus, ShoppingCart, CheckCircle, Clock, Truck, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import socketManager from '@/utils/socket';
import { apiGet, apiPost } from '@/utils/api';

interface Material {
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
}

interface Review {
  _id: string;
  vendorName: string;
  rating: number;
  isTrusted: boolean;
  comment: string;
  createdAt: string;
  orderAmount?: number;
}

interface Supplier {
  _id: string;
  businessName: string;
  businessType: string;
  productCategories: string[];
  location: {
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
  distance?: number;
  materials?: Material[];
  phone?: string;
  email?: string;
  description?: string;
  establishedYear?: number;
  reviews?: Review[];
}

interface CartItem {
  materialId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  supplierId: string;
  supplierName: string;
  totalPrice: number;
}

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onOrderPlaced
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [activeTab, setActiveTab] = useState('materials');
  const [updatedSupplier, setUpdatedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (isOpen && supplier) {
      setUpdatedSupplier(supplier);
      loadSupplierDetails();
    }
  }, [isOpen, supplier]);

  // Socket listener for real-time review updates
  useEffect(() => {
    if (!supplier) return;

    const socket = socketManager.connect(firebaseUser?.uid || '', 'vendor');
    
    // Listen for new reviews
    socket.on('review_submitted', (data: any) => {
      console.log('New review received:', data);
      if (data.review && data.review.supplierId === supplier._id) {
        // Add the new review to the list
        setReviews(prevReviews => [data.review, ...prevReviews]);
        
        // Update supplier rating in real-time
        setUpdatedSupplier(prevSupplier => {
          if (prevSupplier) {
            const currentTotal = prevSupplier.rating.average * prevSupplier.rating.count;
            const newTotal = currentTotal + data.review.rating;
            const newCount = prevSupplier.rating.count + 1;
            const newAverage = newTotal / newCount;
            
            return {
              ...prevSupplier,
              rating: {
                average: Math.round(newAverage * 10) / 10,
                count: newCount
              }
            };
          }
          return prevSupplier;
        });
        
        // Show notification
        toast({
          title: "New Review Received! ⭐",
          description: `${data.review.vendorName} left a ${data.review.rating}-star review`,
          duration: 5000
        });
      }
    });

    return () => {
      socket.off('review_submitted');
    };
  }, [supplier, toast]);

  const loadSupplierDetails = async () => {
    if (!supplier) return;
    
    setLoading(true);
    try {
      if (!firebaseUser) {
        throw new Error('No Firebase user available');
      }

      const token = await firebaseUser.getIdToken();
      
      // Load materials
      const materialsResponse = await apiGet(`api/suppliers/${supplier._id}/materials`, {
        'Authorization': `Bearer ${token}`
      });

      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setMaterials(materialsData.materials || []);
      }

      // Load reviews from the new API endpoint
      try {
        const reviewsResponse = await apiGet(`api/suppliers/${supplier._id}/reviews`);

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
          
          // Update supplier rating if available
          if (reviewsData.statistics) {
            console.log('Updated supplier rating:', reviewsData.statistics);
            
            // Update the supplier object with new rating data
            if (supplier) {
              const updatedSupplierData = {
                ...supplier,
                rating: {
                  average: reviewsData.statistics.averageRating || 0,
                  count: reviewsData.statistics.totalReviews || 0
                }
              };
              setUpdatedSupplier(updatedSupplierData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (material: Material) => {
    const existingItem = cart.find(item => item.materialId === material._id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.materialId === material._id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: material.price * (item.quantity + 1) }
          : item
      ));
    } else {
      const newItem: CartItem = {
        materialId: material._id,
        name: material.name,
        price: material.price,
        quantity: 1,
        unit: material.unit,
        supplierId: supplier!._id,
        supplierName: supplier!.businessName,
        totalPrice: material.price
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${material.name} added to your cart`,
    });
  };

  const updateQuantity = (materialId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(materialId);
    } else {
      setCart(cart.map(item => {
        if (item.materialId === materialId) {
          return { ...item, quantity, totalPrice: item.price * quantity };
        }
        return item;
      }));
    }
  };

  const removeFromCart = (materialId: string) => {
    setCart(cart.filter(item => item.materialId !== materialId));
  };

  const handlePlaceOrder = async () => {
    if (!supplier || cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive"
      });
      return;
    }

    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode) {
      toast({
        title: "Missing Information",
        description: "Please fill in the delivery address",
        variant: "destructive"
      });
      return;
    }

    setPlacingOrder(true);
    try {
      if (!firebaseUser) {
        throw new Error('No Firebase user available');
      }

      const token = await firebaseUser.getIdToken();

      const response = await apiPost('api/orders/place', {
        supplierId: supplier._id,
        items: cart.map(item => ({
          itemId: item.materialId,
          itemName: item.name,
          quantity: item.quantity
        })),
        deliveryAddress,
        deliveryInstructions,
        notes: `Custom order from ${supplier.businessName}`
      }, {
        'Authorization': `Bearer ${token}`
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Order Placed Successfully!",
          description: "Your order has been sent to the supplier. You'll be notified of updates.",
        });
        setCart([]);
        onOrderPlaced();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const priceRange = materials.length > 0 ? {
    min: Math.min(...materials.map(m => m.price)),
    max: Math.max(...materials.map(m => m.price))
  } : null;

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {updatedSupplier?.businessName || supplier?.businessName}
                {(updatedSupplier?.isVerified || supplier?.isVerified) && (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </h2>
              <p className="text-muted-foreground">{supplier.businessType}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Business Profile Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Business Name</Label>
                  <p className="text-sm text-muted-foreground">{updatedSupplier?.businessName || supplier?.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Business Type</Label>
                  <p className="text-sm text-muted-foreground">{supplier.businessType}</p>
                </div>
                {supplier.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{supplier.description}</p>
                  </div>
                )}
                {supplier.establishedYear && (
                  <div>
                    <Label className="text-sm font-medium">Established</Label>
                    <p className="text-sm text-muted-foreground">{supplier.establishedYear}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Rating & Reviews</Label>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{(updatedSupplier?.rating.average || supplier?.rating.average || 0).toFixed(1)}</span>
                    <span className="text-muted-foreground">({updatedSupplier?.rating.count || supplier?.rating.count || 0} reviews)</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-600" />
                        <span>{reviews.filter(r => r.isTrusted).length} trusted</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-red-600" />
                        <span>{reviews.filter(r => !r.isTrusted).length} not trusted</span>
                      </div>
                    </div>
                  )}
                </div>
                {supplier.distance && (
                  <div>
                    <Label className="text-sm font-medium">Distance</Label>
                    <p className="text-sm text-muted-foreground">{supplier.distance.toFixed(1)} km away</p>
                  </div>
                )}
                {supplier.location.address && (
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm text-muted-foreground">{supplier.location.address}</p>
                  </div>
                )}
                {supplier.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                  </div>
                )}
                {supplier.email && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{supplier.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Materials, Reviews, and Order */}
          <div className="space-y-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'materials' 
                    ? 'border-b-2 border-primary text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                Available Materials ({materials.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'reviews' 
                    ? 'border-b-2 border-primary text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'order' 
                    ? 'border-b-2 border-primary text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                Place Order ({cart.length})
              </button>
            </div>

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading materials...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No materials available</p>
                  </div>
                ) : (
                  <>
                    {/* Price Range Summary */}
                    {priceRange && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">Price Range</h4>
                              <p className="text-sm text-blue-700">
                                ₹{priceRange.min} - ₹{priceRange.max} per unit
                              </p>
                            </div>
                            <Badge variant="outline" className="text-blue-700 border-blue-300">
                              {materials.length} items available
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Materials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {materials.map((material) => (
                        <Card key={material._id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{material.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {material.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-green-600">₹{material.price}/{material.unit}</span>
                                <Badge variant={material.isAvailable ? "default" : "secondary"}>
                                  {material.isAvailable ? "Available" : "Unavailable"}
                                </Badge>
                                {material.minimumOrderQuantity > 1 && (
                                  <span className="text-muted-foreground">
                                    Min: {material.minimumOrderQuantity} {material.unit}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>Delivery: {material.deliveryTime} days</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => addToCart(material)}
                              disabled={!material.isAvailable}
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review._id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{review.vendorName}</h4>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <Badge 
                                variant={review.isTrusted ? "default" : "destructive"}
                                className="ml-2"
                              >
                                {review.isTrusted ? "Trusted" : "Not Trusted"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {review.comment}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                              {review.orderAmount && (
                                <span>Order: ₹{review.orderAmount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Order Tab */}
            {activeTab === 'order' && (
              <div className="space-y-4">
                {/* Cart Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Cart ({cart.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Add materials to your cart from the Materials tab
                      </p>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <div key={item.materialId} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                ₹{item.price}/{item.unit}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.materialId, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.materialId, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-medium">₹{item.totalPrice}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.materialId)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span>₹{totalAmount}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                {cart.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Delivery Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={deliveryAddress.street}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                            placeholder="Enter street address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={deliveryAddress.city}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={deliveryAddress.state}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                            placeholder="Enter state"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            value={deliveryAddress.pincode}
                            onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                            placeholder="Enter pincode"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                        <Textarea
                          id="instructions"
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          placeholder="Any special delivery instructions..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Place Order Button */}
                {cart.length > 0 && (
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="w-full"
                    size="lg"
                  >
                    {placingOrder ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Placing Order...
                      </div>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Proceed to Order (₹{totalAmount})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailsModal; 