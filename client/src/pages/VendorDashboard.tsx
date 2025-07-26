import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useApp, Supplier } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, MapPin, User, ShoppingCart, Package, Plus, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { initAnimations, cleanupAnimations } from '@/lib/gsap';

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { suppliers, searchSuppliers, submitVendorRequest } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>(suppliers);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    initAnimations();
    return () => cleanupAnimations();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = searchSuppliers(query);
    setFilteredSuppliers(results);
  };

  const handleSupplierProfile = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [itemId]: quantity });
    }
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalAmount = () => {
    if (!selectedSupplier) return 0;
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = selectedSupplier.items.find(i => i.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const handleSubmitOrder = () => {
    if (!selectedSupplier || !user || Object.keys(cart).length === 0) return;

    const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
      const item = selectedSupplier.items.find(i => i.id === itemId)!;
      return {
        itemId,
        itemName: item.name,
        quantity,
        price: item.price,
      };
    });

    const request = {
      vendorId: user.id,
      vendorName: user.name || 'Vendor',
      vendorEmail: user.email,
      vendorPhone: user.phone || '+1-234-567-8900',
      supplierId: selectedSupplier.id,
      items: orderItems,
      status: 'pending' as const,
      totalAmount: getTotalAmount(),
    };

    submitVendorRequest(request);
    setCart({});
    
    toast({
      title: "Order Submitted",
      description: `Your order has been sent to ${selectedSupplier.name}. You'll be notified when they respond.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Find suppliers, browse products, and manage your orders.
          </p>
        </div>

        {!selectedSupplier ? (
          <>
            {/* Search Section */}
            <Card className="dashboard-card shadow-xl rounded-xl border-0 bg-white/80 backdrop-blur mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Find Suppliers
                </CardTitle>
                <CardDescription>
                  Search for products and suppliers in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search for products, categories, or suppliers..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="dashboard-card bg-white shadow-md rounded-xl p-4 hover:shadow-glow-cyan-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium">{supplier.rating}</span>
                            <span className="ml-1 text-sm text-muted-foreground">
                              ({supplier.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          {supplier.location}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Available Products:</h4>
                        <div className="space-y-1">
                          {supplier.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.name}</span>
                              <span className="font-medium text-primary">${item.price}</span>
                            </div>
                          ))}
                          {supplier.items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{supplier.items.length - 3} more products
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => handleSupplierProfile(supplier)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        View Profile & Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSuppliers.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No suppliers found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try different search terms' : 'No suppliers available at the moment'}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Supplier Profile & Order Section */
          <div>
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedSupplier(null)}
                className="mr-4"
              >
                ← Back to Suppliers
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedSupplier.name}</h2>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{selectedSupplier.rating}</span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    ({selectedSupplier.reviews} reviews)
                  </span>
                  <span className="ml-4 text-sm text-muted-foreground flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {selectedSupplier.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Products List */}
              <div className="lg:col-span-2">
                <Card className="shadow-card border-0">
                  <CardHeader>
                    <CardTitle>Available Products</CardTitle>
                    <CardDescription>
                      Select products and quantities for your order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedSupplier.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-lg font-bold text-primary">${item.price}</span>
                              <Badge variant="secondary">Stock: {item.stock}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateCartQuantity(item.id, (cart[item.id] || 0) - 1)}
                              disabled={!cart[item.id]}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {cart[item.id] || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateCartQuantity(item.id, (cart[item.id] || 0) + 1)}
                              disabled={cart[item.id] >= item.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="shadow-card border-0 sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(cart).length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                        <p className="text-sm text-muted-foreground">Add products to create an order</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {Object.entries(cart).map(([itemId, quantity]) => {
                            const item = selectedSupplier.items.find(i => i.id === itemId)!;
                            return (
                              <div key={itemId} className="flex justify-between text-sm">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-muted-foreground">{quantity} × ${item.price}</p>
                                </div>
                                <p className="font-medium">${(item.price * quantity).toFixed(2)}</p>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="border-t pt-4">
                          <div className="flex justify-between font-semibold">
                            <span>Total ({getTotalItems()} items)</span>
                            <span>${getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={handleSubmitOrder}
                        >
                          Submit Order
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          Your order will be sent to {selectedSupplier.name} for approval
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default VendorDashboard;