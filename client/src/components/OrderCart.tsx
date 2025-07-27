import React, { useState } from 'react';
import { ShoppingCart, Package, Trash2, Plus, Minus, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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

interface OrderCartProps {
  items: CartItem[];
  onUpdateQuantity: (materialId: string, quantity: number) => void;
  onRemoveItem: (materialId: string) => void;
  onPlaceOrder: (orderData: any) => void;
  loading?: boolean;
}

const OrderCart: React.FC<OrderCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  loading = false
}) => {
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Online Payment');
  const { toast } = useToast();

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (materialId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(materialId);
    } else {
      onUpdateQuantity(materialId, newQuantity);
    }
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) {
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

    // Group items by supplier
    const ordersBySupplier = items.reduce((acc, item) => {
      if (!acc[item.supplierId]) {
        acc[item.supplierId] = {
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          items: []
        };
      }
      acc[item.supplierId].items.push({
        materialId: item.materialId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
        totalPrice: item.totalPrice
      });
      return acc;
    }, {} as Record<string, any>);

    // Create order data
    const orderData = {
      orders: Object.values(ordersBySupplier),
      deliveryAddress,
      deliveryInstructions,
      paymentMethod,
      totalAmount
    };

    onPlaceOrder(orderData);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground">
              Add materials from suppliers to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Cart ({totalItems} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.materialId} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.supplierName} • ₹{item.price}/{item.unit}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.materialId, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.materialId, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="text-right">
                <p className="font-medium">₹{item.totalPrice}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.materialId)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Information */}
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

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Online Payment', 'Cash on Delivery', 'Bank Transfer'].map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={method}
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4"
                />
                <Label htmlFor={method}>{method}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal ({totalItems} items)</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charges</span>
            <span>₹0</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span>₹{totalAmount}</span>
          </div>
          
          <Button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full mt-4"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Place Order
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCart; 