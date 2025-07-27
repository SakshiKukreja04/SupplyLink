import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Package, 
  MapPin, 
  ShoppingCart, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Star,
  Mail,
  Phone as PhoneIcon
} from 'lucide-react';
import socketManager from '@/utils/socket';

interface SupplierProfile {
  _id?: string;
  firebaseUid?: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  productCategories: string[];
  location?: {
    lat: number;
    lng: number;
  };
  isVerified?: boolean;
  rating?: {
    average: number;
    count: number;
  };
  isActive?: boolean;
}

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

interface VendorRequest {
  _id: string;
  vendorId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
}

const SupplierDetails: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendorRequests, setVendorRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && firebaseUser) {
      loadProfile();
      loadMaterials();
      loadVendorRequests();
      setupSocketListeners();
    }
  }, [user, firebaseUser]);

  const setupSocketListeners = () => {
    socketManager.onOrderRequestSent((data) => {
      toast({
        title: "New Order Request",
        description: `You have a new order request from ${data.vendor?.name || 'a vendor'}`,
      });
      loadVendorRequests();
    });

    socketManager.onPaymentMade((data) => {
      toast({
        title: "Payment Received",
        description: `Payment of $${data.amount} received for order #${data.orderId}`,
      });
      loadVendorRequests();
    });
  };

  const loadProfile = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch('/api/suppliers/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.supplier);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch('/api/suppliers/materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadVendorRequests = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch('/api/suppliers/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVendorRequests(data.orders);
      }
    } catch (error) {
      console.error('Error loading vendor requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch(`/api/suppliers/orders/${orderId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          supplierNotes: 'Order approved and will be processed soon.'
        })
      });

      if (response.ok) {
        loadVendorRequests();
        toast({
          title: "Order Approved",
          description: "Order has been approved successfully.",
        });
        
        // Emit socket event
        socketManager.emitSupplierResponse({
          orderId,
          status: 'approved',
          vendorId: vendorRequests.find(req => req._id === orderId)?.vendorId._id
        });
      } else {
        throw new Error('Failed to approve order');
      }
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await fetch(`/api/suppliers/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rejectionReason: 'Unable to fulfill this order at the moment.'
        })
      });

      if (response.ok) {
        loadVendorRequests();
        toast({
          title: "Order Rejected",
          description: "Order has been rejected.",
        });
        
        // Emit socket event
        socketManager.emitSupplierResponse({
          orderId,
          status: 'rejected',
          vendorId: vendorRequests.find(req => req._id === orderId)?.vendorId._id
        });
      } else {
        throw new Error('Failed to reject order');
      }
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Requested':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Approved':
        return <Badge variant="default">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'Paid':
        return <Badge variant="outline">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Supplier Details</h1>
        <p className="text-gray-600 mt-2">Complete overview of your business and vendor requests</p>
      </div>

      <div className="space-y-8">
        {/* Business Profile Summary */}
        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6 text-blue-500" />
              Business Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-12 h-12 text-blue-500" />
                    <div>
                      <div className="text-xl font-bold">{profile.name}</div>
                      <div className="text-gray-600">{profile.businessName}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <PhoneIcon className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.productCategories?.map((cat, idx) => (
                      <Badge key={idx} variant="secondary">{cat}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{profile.rating?.average?.toFixed(1) || '0.0'}</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (profile.rating?.average || 0)
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{materials.length}</div>
                    <div className="text-sm text-gray-600">Materials Listed</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Profile not found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Materials */}
        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6 text-green-500" />
              Available Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No materials listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <Card key={material._id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{material.name}</h4>
                            <p className="text-sm text-gray-600">{material.category}</p>
                          </div>
                          <Badge variant={material.isAvailable ? "default" : "secondary"}>
                            {material.isAvailable ? "Available" : "Out of Stock"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{material.description}</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">₹{material.price}/{material.unit}</div>
                            <div className="text-sm text-gray-600">Qty: {material.quantity}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-500" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.location ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Coordinates</div>
                  <div className="font-mono text-sm">
                    {profile.location.lat.toFixed(4)}, {profile.location.lng.toFixed(4)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Address</div>
                  <div className="text-sm">
                    {/* You can add reverse geocoding here to show actual address */}
                    Location coordinates available
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Location not set</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Requests */}
        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-purple-500" />
              Vendor Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendorRequests.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No vendor requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vendorRequests.map((request) => (
                  <Card key={request._id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Vendor Info */}
                        <div className="flex items-center gap-3">
                          <User className="w-10 h-10 text-blue-500" />
                          <div>
                            <div className="font-semibold">{request.vendorId.name}</div>
                            <div className="text-sm text-gray-600">{request.vendorId.email}</div>
                            <div className="text-sm text-gray-600">{request.vendorId.phone}</div>
                          </div>
                          <div className="ml-auto">
                            {getStatusBadge(request.status)}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div>
                          <h4 className="font-semibold mb-2">Order Items:</h4>
                          <div className="space-y-2">
                            {request.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium">{item.materialName}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.quantity} {item.unitPrice > 0 ? `x ₹${item.unitPrice}` : ''}
                                  </div>
                                </div>
                                <div className="font-semibold">₹{item.totalPrice}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">Total Amount</div>
                            <div className="font-semibold text-lg">₹{request.totalAmount}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Order Date</div>
                            <div className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>

                        {request.deliveryAddress && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Delivery Address</div>
                            <div className="text-sm">{request.deliveryAddress}</div>
                          </div>
                        )}

                        {request.deliveryInstructions && (
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Delivery Instructions</div>
                            <div className="text-sm">{request.deliveryInstructions}</div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {request.status === 'Requested' && (
                          <div className="flex gap-3 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => handleRejectOrder(request._id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />Reject
                            </Button>
                            <Button
                              onClick={() => handleApproveOrder(request._id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierDetails; 