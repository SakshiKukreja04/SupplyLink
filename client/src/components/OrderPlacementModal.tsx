import React, { useState, useEffect } from 'react';
import { X, Package, Plus, Minus, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SupplierItem {
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
  email: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface OrderPlacementModalProps {
  supplier: Supplier;
  items: SupplierItem[];
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: any) => void;
}

interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
}

const OrderPlacementModal: React.FC<OrderPlacementModalProps> = ({
  supplier,
  items,
  isOpen,
  onClose,
  onOrderPlaced
}) => {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedItems([]);
      setDeliveryAddress('');
      setDeliveryInstructions('');
      setNotes('');
      setIsUrgent(false);
    }
  }, [isOpen]);

  const addItemToOrder = (item: SupplierItem) => {
    const existingItem = selectedItems.find(selected => selected.itemId === item._id);
    
    if (existingItem) {
      // Update quantity
      const updatedItems = selectedItems.map(selected => 
        selected.itemId === item._id 
          ? { ...selected, quantity: selected.quantity + 1, totalPrice: item.price * (selected.quantity + 1) }
          : selected
      );
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        itemId: item._id,
        itemName: item.name,
        quantity: 1,
        unit: item.unit,
        price: item.price,
        totalPrice: item.price
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const removeItemFromOrder = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.itemId !== itemId));
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItemFromOrder(itemId);
      return;
    }

    const item = items.find(i => i._id === itemId);
    if (!item) return;

    if (newQuantity < item.minimumOrderQuantity) {
      toast({
        title: "Minimum Order Quantity",
        description: `Minimum order quantity for ${item.name} is ${item.minimumOrderQuantity} ${item.unit}`,
        variant: "destructive"
      });
      return;
    }

    const updatedItems = selectedItems.map(selected => 
      selected.itemId === itemId 
        ? { ...selected, quantity: newQuantity, totalPrice: item.price * newQuantity }
        : selected
    );
    setSelectedItems(updatedItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to place an order.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId: supplier._id,
          items: selectedItems,
          deliveryAddress,
          deliveryInstructions,
          notes,
          isUrgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Order Placed Successfully!",
          description: `Your order has been placed with ${supplier.businessName}`,
        });

        onOrderPlaced(data.order);
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Place Order</h2>
            <p className="text-sm text-muted-foreground">
              Order from {supplier.businessName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{supplier.businessName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{supplier.location.address || `${supplier.location.city}, ${supplier.location.state}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>{items.length} items available</span>
              </div>
            </CardContent>
          </Card>

          {/* Available Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Items</h3>
            <div className="grid gap-4">
              {items.map((item) => (
                <Card key={item._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{item.name}</h4>
                        {!item.isAvailable && (
                          <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{formatPrice(item.price)}/{item.unit}</span>
                        <span className="text-muted-foreground">Min: {item.minimumOrderQuantity} {item.unit}</span>
                        <span className="text-muted-foreground">Delivery: {item.deliveryTime} day{item.deliveryTime !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addItemToOrder(item)}
                      disabled={!item.isAvailable}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Selected Items</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {selectedItems.map((item) => (
                      <div key={item.itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.itemName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)}/{item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium ml-4">{formatPrice(item.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="font-semibold text-lg">{formatPrice(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delivery Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                <Textarea
                  id="deliveryInstructions"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Any special delivery instructions"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes for the supplier"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                />
                <Label htmlFor="isUrgent">Mark as urgent order</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePlaceOrder} 
              disabled={loading || selectedItems.length === 0}
              className="flex-1"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPlacementModal; 