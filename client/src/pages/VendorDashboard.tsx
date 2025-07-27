import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Star, MapPin, User, ShoppingCart, Package, Plus, Minus, Bell, Clock, CheckCircle, XCircle, CreditCard, DollarSign, Truck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LocationDisplay from '@/components/LocationDisplay';
import VendorSearchBar from '@/components/VendorSearchBar';
import SupplierCard from '@/components/SupplierCard';
import SupplierDetailsModal from '@/components/SupplierDetailsModal';
import OrderCart from '@/components/OrderCart';
import NearbySuppliersMap from '@/components/NearbySuppliersMap';
import ReviewModal from '@/components/ReviewModal';
import socketManager from '@/utils/socket';
import { initAnimations, cleanupAnimations } from '@/lib/gsap';

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
  materials?: any[];
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

interface Order {
  _id: string;
  supplierId: string;
  items: any[];
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  createdAt: string;
  supplier?: Supplier;
}

const VendorDashboard: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  // Socket connection
  useEffect(() => {
    if (user?.id) {
      const socket = socketManager.connect(user.id, 'vendor');
      
      // Listen for real-time order status updates
      socket.on('order_placed', (data: any) => {
        console.log('Order placed confirmation:', data);
        if (data.type === 'order_request_sent') {
          toast({
            title: "Order Request Sent",
            description: data.message || "Order request sent. Waiting for supplier approval...",
          });
          loadOrders(); // Refresh orders list
        }
      });

      socket.on('order_approved', (data: any) => {
        console.log('Order approved:', data);
        toast({
          title: "🎉 Order Approved!",
          description: data.message || "Your order has been approved! Click 'Proceed to Payment' to complete your purchase.",
          duration: 5000, // Show for 5 seconds
        });
        loadOrders(); // Refresh orders list
        
        // Switch to orders tab to show the approved order
        setActiveTab('orders');
      });

      socket.on('order_rejected', (data: any) => {
        console.log('Order rejected:', data);
        toast({
          title: "Order Rejected",
          description: data.message || "Your order was rejected by the supplier.",
          variant: "destructive"
        });
        loadOrders(); // Refresh orders list
      });

      // Listen for payment confirmation
      socket.on('payment_confirmed', (data: any) => {
        console.log('Payment confirmed:', data);
        toast({
          title: "💳 Payment Confirmed!",
          description: "Your payment has been processed. The supplier will now process your order.",
          duration: 5000,
        });
        loadOrders(); // Refresh orders list
      });

      // Listen for payment done event
      socket.on('payment_done', (data: any) => {
        console.log('Payment done:', data);
        toast({
          title: "🎉 Payment Successful!",
          description: `Payment of ₹${data.amount} completed. Order is now ready for dispatch.`,
          duration: 5000,
        });
        loadOrders(); // Refresh orders list
      });

      // Listen for order dispatched event
      socket.on('order_dispatched', (data: any) => {
        console.log('Order dispatched:', data);
        toast({
          title: "🚚 Order Successfully Dispatched!",
          description: data.message || `Order #${data.order?._id?.slice(-6)} has been dispatched by ${data.order?.supplierName}`,
          duration: 8000, // Show for longer duration
        });
        
        // Switch to orders tab to show the updated status
        setActiveTab('orders');
        loadOrders(); // Refresh orders list
      });

      // Listen for new reviews to update supplier ratings in real-time
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
    }

    initAnimations();
    loadOrders();
    
    return () => {
      cleanupAnimations();
      socketManager.disconnect();
    };
  }, [user]);

  const loadOrders = async () => {
    try {
      if (!firebaseUser) {
        console.error('No Firebase user available');
        return;
      }

      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/vendors/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

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

  const handleSearch = (searchResults: Supplier[]) => {
    setSuppliers(searchResults);
    
    // Fetch updated ratings for all suppliers after search
    if (searchResults.length > 0) {
      searchResults.forEach(supplier => {
        fetchUpdatedSupplierRating(supplier._id);
      });
    }
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierDetails(true);
  };



  const addToCart = (material: any, supplier: Supplier) => {
    const existingItem = cart.find(item => item.materialId === material._id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.materialId === material._id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: CartItem = {
        materialId: material._id,
        name: material.name,
        price: material.price,
        quantity: 1,
        unit: material.unit,
        supplierId: supplier._id,
        supplierName: supplier.businessName,
        totalPrice: material.price
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${material.name} added to your cart`,
    });
  };

  const updateCartQuantity = (materialId: string, quantity: number) => {
    setCart(cart.map(item => 
      item.materialId === materialId 
        ? { ...item, quantity, totalPrice: quantity * item.price }
        : item
    ));
  };

  const removeFromCart = (materialId: string) => {
    setCart(cart.filter(item => item.materialId !== materialId));
  };

  const handlePlaceOrder = async (orderData: any) => {
    setLoading(true);
    try {
      if (!firebaseUser) {
        console.error('No Firebase user available');
        return;
      }

      const token = await firebaseUser.getIdToken();

      // Place orders for each supplier
      for (const order of orderData.orders) {
        const response = await fetch('/api/vendors/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            supplierId: order.supplierId,
            items: order.items,
            deliveryAddress: orderData.deliveryAddress,
            deliveryInstructions: orderData.deliveryInstructions,
            paymentMethod: orderData.paymentMethod
          })
        });

        if (!response.ok) {
          throw new Error('Failed to place order');
        }
      }

      // Clear cart
      setCart([]);
      
      toast({
        title: "Order Placed Successfully!",
        description: "Your orders have been sent to suppliers. You'll be notified of updates.",
      });

      // Load updated orders
      loadOrders();
      setActiveTab('orders');

    } catch (error) {
      console.error('Failed to place order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      if (!firebaseUser) {
        console.error('No Firebase user available');
        return;
      }

      // Find the order details
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        toast({
          title: "Order Not Found",
          description: "Could not find order details for payment.",
          variant: "destructive"
        });
        return;
      }

      // Show payment confirmation
      const confirmed = window.confirm(
        `Confirm Payment\n\nOrder: #${orderId.slice(-6)}\nAmount: ₹${order.totalAmount}\nItems: ${order.items.length}\n\nProceed with Razorpay payment?`
      );

      if (!confirmed) {
        return;
      }

      const token = await firebaseUser.getIdToken();

      // Create Razorpay order
      const createOrderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: order.totalAmount,
          orderId: order._id,
          vendorId: user?.id,
          supplierId: order.supplierId
        })
      });

      if (!createOrderResponse.ok) {
        // Handle JSON parsing errors
        let errorData;
        try {
          const responseText = await createOrderResponse.text();
          console.log('Response text:', responseText);
          
          if (responseText.trim() === '') {
            throw new Error('Empty response from server');
          }
          
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          throw new Error(`Server response error: ${parseError.message}`);
        }
        
        console.error('Payment creation failed:', errorData);
        
        // Handle specific error cases
        if (errorData.error === 'Payment gateway not configured') {
          throw new Error('Payment gateway not configured. Please contact support.');
        } else if (errorData.error === 'Razorpay configuration error') {
          throw new Error('Payment gateway configuration error. Please try again later.');
        } else if (errorData.error === 'MISSING_AUTH_HEADER' || errorData.error === 'INVALID_TOKEN') {
          throw new Error('Authentication error. Please log in again.');
        } else {
          throw new Error(errorData.message || 'Failed to create payment order');
        }
      }

      const razorpayOrder = await createOrderResponse.json();

      // Initialize Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_ACTUAL_KEY_ID', // Use environment variable or fallback
        amount: razorpayOrder.order.amount,
        currency: razorpayOrder.order.currency,
        name: 'SupplyLink',
        description: `Order Payment - #${orderId.slice(-6)}`,
        order_id: razorpayOrder.order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order._id,
                amount: order.totalAmount
              })
            });

            if (verifyResponse.ok) {
              let verifyData;
              try {
                const responseText = await verifyResponse.text();
                if (responseText.trim() === '') {
                  throw new Error('Empty response from server');
                }
                verifyData = JSON.parse(responseText);
              } catch (parseError) {
                console.error('Payment verification JSON parsing error:', parseError);
                throw new Error(`Payment verification error: ${parseError.message}`);
              }
              
              toast({
                title: "Payment Successful! 🎉",
                description: `Payment of ₹${order.totalAmount} processed successfully. Payment ID: ${response.razorpay_payment_id}`,
              });
              loadOrders(); // Refresh orders to show updated status
            } else {
              let errorData;
              try {
                const responseText = await verifyResponse.text();
                if (responseText.trim() === '') {
                  throw new Error('Empty response from server');
                }
                errorData = JSON.parse(responseText);
              } catch (parseError) {
                console.error('Payment verification error JSON parsing:', parseError);
                throw new Error(`Payment verification failed: ${parseError.message}`);
              }
              throw new Error(errorData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Failed to verify payment. Please contact support.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: user?.name || 'Vendor',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Find suppliers, browse materials, and manage your orders with real-time updates.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search & Order</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="cart">
              Cart ({cart.length})
              {orders.some(order => order.status === 'approved') && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {orders.filter(order => order.status === 'approved').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Bar */}
            <VendorSearchBar 
              onSearch={handleSearch}
              onLoading={setLoading}
            />

            {/* Location Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <LocationDisplay 
                  userRole="vendor" 
                  onLocationUpdate={(locationData) => {
                    console.log('Vendor location updated:', locationData);
                  }}
                />
              </div>
              
              <div className="lg:col-span-2">
                <NearbySuppliersMap 
                  onSupplierSelect={(supplier) => {
                    console.log('Selected supplier:', supplier);
                    setSelectedSupplier(supplier);
                    setShowSupplierDetails(true);
                  }}
                />
              </div>
            </div>

            {/* Search Results */}
            {suppliers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Personalized Suppliers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suppliers.map((supplier) => (
                    <SupplierCard
                      key={supplier._id}
                      supplier={supplier}
                      onSelectSupplier={handleSelectSupplier}
                    />
                  ))}
                </div>
              </div>
            )}

            {suppliers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No suppliers found</h3>
                <p className="text-muted-foreground">
                  Search for materials to find nearby suppliers
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  My Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                    <p className="text-muted-foreground">
                      Start by searching for materials and placing orders
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order._id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="font-medium text-lg">Order #{order._id.slice(-6)}</h4>
                              <Badge variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'dispatched' ? 'secondary' :
                                order.status === 'paid' ? 'outline' :
                                order.status === 'approved' ? 'secondary' :
                                order.status === 'rejected' ? 'destructive' :
                                'secondary'
                              }>
                                {order.status}
                              </Badge>
                              {order.paymentStatus && (
                                <Badge variant={
                                  order.paymentStatus === 'paid' ? 'default' :
                                  order.paymentStatus === 'failed' ? 'destructive' :
                                  'secondary'
                                }>
                                  {order.paymentStatus}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Order Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Order Summary</p>
                                <p className="text-sm text-muted-foreground">
                                  Total: ₹{order.totalAmount}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Items: {order.items.length} • Date: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                                {order.supplier?.businessName && (
                                  <p className="text-sm text-muted-foreground">
                                    Supplier: {order.supplier.businessName}
                                  </p>
                                )}
                              </div>
                              
                              {/* Order Items */}
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">Order Items</p>
                                <div className="space-y-1">
                                  {order.items.slice(0, 3).map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-xs">
                                      <span>{item.itemName} x {item.quantity} {item.unit}</span>
                                      <span className="font-medium">₹{item.totalPrice}</span>
                                    </div>
                                  ))}
                                  {order.items.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{order.items.length - 3} more items
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Status-specific information */}
                            {order.status === 'approved' && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <p className="text-sm font-medium text-green-800">
                                    Order Approved! Ready for Payment
                                  </p>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                  Your order has been approved by the supplier. Please proceed with payment to confirm your order.
                                </p>
                              </div>
                            )}
                            
                            {order.status === 'paid' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <p className="text-sm font-medium text-blue-800">
                                    Payment Confirmed! Order Processing
                                  </p>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                  Your payment has been received. The supplier is now processing your order.
                                </p>
                              </div>
                            )}
                            
                            {order.status === 'dispatched' && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-orange-600" />
                                  <p className="text-sm font-medium text-orange-800">
                                    Order Dispatched! 🚚
                                  </p>
                                </div>
                                <p className="text-xs text-orange-600 mt-1">
                                  Your order has been dispatched by the supplier and is on its way to you.
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            {order.status === 'approved' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handlePayment(order._id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Proceed to Payment
                              </Button>
                            )}
                            {order.status === 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Processing
                              </Button>
                            )}
                            {order.status === 'dispatched' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrderForReview(order);
                                  setShowReviewModal(true);
                                }}
                              >
                                Add Review
                              </Button>
                            )}
                            {order.status === 'delivered' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrderForReview(order);
                                  setShowReviewModal(true);
                                }}
                              >
                                Add Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cart" className="space-y-6">
            {/* Payment Alert for Approved Orders */}
            {orders.some(order => order.status === 'approved') && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800">Orders Ready for Payment</h4>
                      <p className="text-sm text-green-600">
                        You have {orders.filter(order => order.status === 'approved').length} approved order(s) waiting for payment.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setActiveTab('orders')}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <OrderCart
              items={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onPlaceOrder={handlePlaceOrder}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Supplier Details Modal */}
      <SupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={showSupplierDetails}
        onClose={() => {
          setShowSupplierDetails(false);
          setSelectedSupplier(null);
        }}
        onOrderPlaced={loadOrders}
      />

      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedOrderForReview(null);
          }}
          orderId={selectedOrderForReview._id}
          supplierId={selectedOrderForReview.supplierId}
          supplierName={selectedOrderForReview.supplier?.businessName || 'Supplier'}
          orderAmount={selectedOrderForReview.totalAmount}
          onSubmitSuccess={() => {
            // Refresh orders to show any updated review status
            loadOrders();
          }}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default VendorDashboard;