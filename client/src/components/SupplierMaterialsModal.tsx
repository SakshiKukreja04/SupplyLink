import React, { useState, useEffect } from 'react';
import { X, Package, Plus, Minus, ShoppingCart, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  materials?: Material[];
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

interface SupplierMaterialsModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

const SupplierMaterialsModal: React.FC<SupplierMaterialsModalProps> = ({
  supplier,
  isOpen,
  onClose,
  onOrderPlaced
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
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
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (isOpen && supplier) {
      loadMaterials();
    }
  }, [isOpen, supplier]);

  const loadMaterials = async () => {
    if (!supplier) return;
    
    setLoading(true);
    try {
      if (!firebaseUser) {
        throw new Error('No Firebase user available');
      }

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/suppliers/${supplier._id}/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      } else {
        throw new Error('Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier materials",
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

      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId: supplier._id,
          items: cart.map(item => ({
            itemId: item.materialId,
            itemName: item.name,
            quantity: item.quantity
          })),
          deliveryAddress,
          deliveryInstructions,
          notes: `Order placed from ${supplier.businessName}`
        })
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

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{supplier.businessName}</h2>
              <p className="text-muted-foreground">{supplier.businessType}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materials List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Materials</h3>
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
                <div className="space-y-3">
                  {materials.map((material) => (
                    <Card key={material._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{material.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {material.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">₹{material.price}/{material.unit}</span>
                            <Badge variant={material.isAvailable ? "default" : "secondary"}>
                              {material.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            {material.minimumOrderQuantity > 1 && (
                              <span className="text-muted-foreground">
                                Min: {material.minimumOrderQuantity} {material.unit}
                              </span>
                            )}
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
              )}
            </div>

            {/* Cart and Order Form */}
            <div className="space-y-4">
              {/* Cart */}
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
                      Add materials to your cart
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
                      <MapPin className="w-5 h-5" />
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
                      Place Order (₹{totalAmount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierMaterialsModal; 