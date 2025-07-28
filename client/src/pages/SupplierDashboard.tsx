import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import socketManager from '@/utils/socket';
import { apiCall, apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building2, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Star,
  Mail,
  Phone as PhoneIcon,
  ArrowRight,
  CheckCircle,
  Truck
} from 'lucide-react';
import LocationDisplay from '@/components/LocationDisplay';

interface SupplierProfile {
  _id?: string;
  firebaseUid?: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  category: string;
  productCategories: string[];
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  availableItems?: Array<{
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
  isVerified?: boolean;
  rating?: {
    average: number;
    count: number;
  };
  isActive?: boolean;
  description?: string;
  website?: string;
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

interface Review {
  _id: string;
  vendorName: string;
  vendorEmail?: string;
  rating: number;
  isTrusted: boolean;
  comment: string;
  createdAt: string;
  orderAmount?: number;
}

const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [formData, setFormData] = useState<SupplierProfile>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    category: '',
    productCategories: []
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    unit: 'kg',
    category: '',
    minimumOrderQuantity: 1,
    deliveryTime: 1
  });

  // Handle location update from LocationDisplay component
  const handleLocationUpdate = (locationData: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }) => {
    console.log('Location updated:', locationData);
    
    // Update form data with location
    setFormData(prev => ({
      ...prev,
      location: locationData
    }));

    // Update profile with location
    if (profile) {
      setProfile(prev => prev ? {
        ...prev,
        location: locationData
      } : null);
    }
  };

  useEffect(() => {
    if (user && firebaseUser) {
      // Auto-populate auth data
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
      
      // Connect to WebSocket
      const socket = socketManager.connect(firebaseUser.uid, 'supplier');
      
      // Set up WebSocket listeners for real-time updates
      socket.on('profile_updated', (data) => {
        console.log('Profile updated via WebSocket:', data);
        if (data.type === 'supplier_profile') {
          setProfile(data.data);
          setFormData(prev => ({
            ...prev,
            name: data.data.name || user?.name || '',
            email: data.data.email || user?.email || '',
            phone: data.data.phone || user?.phone || '',
            businessName: data.data.businessName || '',
            businessType: data.data.businessType || '',
            category: data.data.category || '',
            productCategories: data.data.productCategories || []
          }));
    toast({
            title: "Profile Updated",
            description: "Your profile has been updated in real-time.",
          });
        }
      });

      socket.on('material_added', (data) => {
        console.log('Material added via WebSocket:', data);
        loadMaterials();
        toast({
          title: "Material Added",
          description: "New material has been added successfully.",
        });
      });

      socket.on('material_updated', (data) => {
        console.log('Material updated via WebSocket:', data);
        loadMaterials();
        toast({
          title: "Material Updated",
          description: "Material has been updated successfully.",
        });
      });

      socket.on('material_deleted', (data) => {
        console.log('Material deleted via WebSocket:', data);
        loadMaterials();
        toast({
          title: "Material Deleted",
          description: "Material has been deleted successfully.",
        });
      });

      // Listen for real-time order requests
      socket.on('order_request', (data) => {
        console.log('New order request received:', data);
        toast({
          title: "New Order Request",
          description: `Order request from ${data.order.vendorName} for ₹${data.order.totalAmount}`,
        });
        loadOrders(); // Refresh orders list
      });

      // Listen for order approval confirmation
      socket.on('order_approval_sent', (data) => {
        console.log('Order approval sent:', data);
        toast({
          title: "Order Approved",
          description: `Order approval sent to ${data.order.vendorName}`,
        });
        loadOrders(); // Refresh orders list
      });

      // Listen for order rejection confirmation
      socket.on('order_rejection_sent', (data) => {
        console.log('Order rejection sent:', data);
        toast({
          title: "Order Rejected",
          description: `Order rejection sent to ${data.order.vendorName}`,
        });
        loadOrders(); // Refresh orders list
      });

      loadProfile();
      loadMaterials();
      loadOrders();
    }

    return () => {
      socketManager.disconnect();
    };
  }, [user, firebaseUser]);

  // Load reviews when profile is available
  useEffect(() => {
    if (profile?._id) {
      loadReviews();
    }
  }, [profile?._id]);

  // Socket listener for real-time review updates
  useEffect(() => {
    if (!profile?._id || !firebaseUser?.uid) return;

    const socket = socketManager.connect(firebaseUser.uid, 'supplier');
    
    // Listen for new reviews
    socket.on('review_submitted', (data: any) => {
      console.log('New review received:', data);
      if (data.review && data.review.supplierId === profile._id) {
        // Add the new review to the list
        setReviews(prevReviews => [data.review, ...prevReviews]);
        
        // Update profile rating statistics in real-time
        setProfile(prevProfile => {
          if (prevProfile) {
            // Calculate new average rating and count
            const currentTotal = (prevProfile.rating?.average || 0) * (prevProfile.rating?.count || 0);
            const newTotal = currentTotal + data.review.rating;
            const newCount = (prevProfile.rating?.count || 0) + 1;
            const newAverage = newTotal / newCount;
            
            return {
              ...prevProfile,
              rating: {
                average: Math.round(newAverage * 10) / 10, // Round to 1 decimal place
                count: newCount
              }
            };
          }
          return prevProfile;
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
  }, [profile?._id, toast]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiGet('api/suppliers/profile', {
        'Authorization': `Bearer ${token}`
      });
      if (response.ok) {
        const data = await response.json();
        if (data.supplier) {
          setProfile(data.supplier);
          setFormData(prev => ({
            ...prev,
            name: data.supplier.name || user?.name || '',
            email: data.supplier.email || user?.email || '',
            phone: data.supplier.phone || user?.phone || '',
            businessName: data.supplier.businessName || '',
            businessType: data.supplier.businessType || '',
            category: data.supplier.category || '',
            productCategories: data.supplier.productCategories || [],
            location: data.supplier.location || undefined
          }));
          setIsCreating(false);
        } else {
          setProfile(null);
          setIsCreating(true);
        }
      } else {
        setProfile(null);
        setIsCreating(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      setIsCreating(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiGet('api/suppliers/materials', {
        'Authorization': `Bearer ${token}`
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiGet('api/orders/supplier', {
        'Authorization': `Bearer ${token}`
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadReviews = async () => {
    try {
      if (!profile?._id) return;
      
      const response = await apiGet(`api/suppliers/${profile._id}/reviews`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        console.log('Loaded reviews:', data.reviews?.length || 0);
        
        // Update profile rating statistics if available
        if (data.statistics) {
          setProfile(prevProfile => {
            if (prevProfile) {
              return {
                ...prevProfile,
                rating: {
                  average: data.statistics.averageRating || 0,
                  count: data.statistics.totalReviews || 0
                }
              };
            }
            return prevProfile;
          });
          console.log('Updated profile rating statistics:', data.statistics);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (!formData.businessName || formData.businessName.trim() === '') {
    toast({
          title: "Validation Error",
          description: "Business name is required",
          variant: "destructive"
        });
        return;
      }
      
      // Clean up form data - remove empty name if not provided
      const cleanFormData = { ...formData };
      if (!cleanFormData.name || cleanFormData.name.trim() === '') {
        delete cleanFormData.name;
      }
      
      console.log('Saving supplier profile with data:', cleanFormData);
      
      const token = await firebaseUser?.getIdToken();
      const method = profile ? 'PATCH' : 'POST';
      const response = await apiCall('api/suppliers/profile', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanFormData)
      });
      
      console.log('Profile save response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.supplier);
        setIsEditing(false);
        setIsCreating(false);
        
        // Emit WebSocket event for real-time update
        socketManager.emit('profile_updated', {
          userId: firebaseUser?.uid,
          type: 'supplier_profile',
          data: data.supplier
        });
        
        toast({
          title: profile ? "Profile Updated" : "Profile Created",
          description: profile ? "Your business profile has been updated." : "Your business profile has been created.",
        });
      } else {
        // Handle error response
        let errorMessage = 'Failed to save profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddMaterial = async () => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiPost('api/suppliers/materials', {
        name: materialForm.name,
        description: materialForm.description,
        price: materialForm.price,
        quantity: materialForm.quantity,
        unit: materialForm.unit,
        category: materialForm.category,
        minimumOrderQuantity: materialForm.minimumOrderQuantity,
        deliveryTime: materialForm.deliveryTime
      }, {
        'Authorization': `Bearer ${token}`
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setMaterials([...materials, data.material]);
          setMaterialForm({
            name: '',
            description: '',
            price: 0,
            quantity: 0,
            unit: 'kg',
            category: '',
            minimumOrderQuantity: 1,
            deliveryTime: 1
          });
          setIsAddingMaterial(false);
          
          // Emit WebSocket event for real-time update
          socketManager.emit('material_added', {
            supplierId: firebaseUser?.uid,
            material: data.material
          });
          
    toast({
            title: "Material Added",
            description: "New material has been added successfully.",
          });
        } else {
          // Handle empty response
          console.log('Empty response received, refreshing materials list');
          loadMaterials();
          setMaterialForm({
            name: '',
            description: '',
            price: 0,
            quantity: 0,
            unit: 'kg',
            category: '',
            minimumOrderQuantity: 1,
            deliveryTime: 1
          });
          setIsAddingMaterial(false);
          
          toast({
            title: "Material Added",
            description: "New material has been added successfully.",
          });
        }
      } else {
        // Handle error response
        let errorMessage = 'Failed to add material';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add material. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMaterial = async (materialId: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const material = materials.find(m => m._id === materialId);
      if (!material) return;

      const response = await apiPut(`api/suppliers/materials/${materialId}`, material, {
        'Authorization': `Bearer ${token}`
      });

      if (response.ok) {
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setMaterials(materials.map(m => m._id === materialId ? data.material : m));
          setEditingMaterial(null);
          
          // Emit WebSocket event for real-time update
          socketManager.emit('material_updated', {
            supplierId: firebaseUser?.uid,
            material: data.material
          });
          
          toast({
            title: "Material Updated",
            description: "Material has been updated successfully.",
          });
        } else {
          // Handle empty response
          console.log('Empty response received, refreshing materials list');
          loadMaterials();
          setEditingMaterial(null);
          
          toast({
            title: "Material Updated",
            description: "Material has been updated successfully.",
          });
        }
      } else {
        // Handle error response
        let errorMessage = 'Failed to update material';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update material. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiDelete(`api/suppliers/materials/${materialId}`, {
        'Authorization': `Bearer ${token}`
      });

      if (response.ok) {
        setMaterials(materials.filter(m => m._id !== materialId));
        
        // Emit WebSocket event for real-time update
        socketManager.emit('material_deleted', {
          supplierId: firebaseUser?.uid,
          materialId
        });
        
        toast({
          title: "Material Deleted",
          description: "Material has been deleted successfully.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete material. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startEditMaterial = (material: Material) => {
    setEditingMaterial(material._id);
    setMaterialForm({
      name: material.name,
      description: material.description,
      price: material.price,
      quantity: material.quantity,
      unit: material.unit,
      category: material.category,
      minimumOrderQuantity: material.minimumOrderQuantity,
      deliveryTime: material.deliveryTime
    });
  };

  const cancelEditMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      unit: 'kg',
      category: '',
      minimumOrderQuantity: 1,
      deliveryTime: 1
    });
  };

  const handleApproveOrder = async (orderId: string, notes?: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiCall(`api/orders/${orderId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        toast({
          title: "Order Approved",
          description: "Order has been approved and vendor has been notified.",
        });
        loadOrders(); // Refresh orders list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve order');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve order",
        variant: "destructive"
      });
    }
  };

  const handleRejectOrder = async (orderId: string, reason?: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiCall(`api/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Order Rejected",
          description: "Order has been rejected and vendor has been notified.",
        });
        loadOrders(); // Refresh orders list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject order",
        variant: "destructive"
      });
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const response = await apiCall(`api/orders/${orderId}/dispatch`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Order Dispatched",
          description: "Order has been dispatched and vendor has been notified.",
        });
        loadOrders(); // Refresh orders list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to dispatch order');
      }
    } catch (error) {
      console.error('Error dispatching order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dispatch order",
        variant: "destructive"
      });
    }
  };

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Dashboard</h1>
          <p className="text-gray-600">Manage your business profile and materials</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Business Profile
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Business Profile</span>
                  {!isEditing && !isCreating && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                  </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing || isCreating ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                          placeholder="Enter business name"
                        />
                        </div>
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <Input
                          id="businessType"
                          value={formData.businessType}
                          onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                          placeholder="e.g., Manufacturing, Wholesale"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Main Category</Label>
                        <Input
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          placeholder="e.g., Raw Materials, Chemicals"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="Enter phone number"
                        />
                    </div>
                    </div>
                    <div>
                      <Label htmlFor="productCategories">Product Categories (comma-separated)</Label>
                      <Input
                        id="productCategories"
                        value={formData.productCategories.join(', ')}
                        onChange={(e) => setFormData({
                          ...formData, 
                          productCategories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat)
                        })}
                        placeholder="e.g., Steel, Aluminum, Copper"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        {profile ? 'Update Profile' : 'Create Profile'}
                      </Button>
                      {isEditing && (
                        <Button onClick={() => setIsEditing(false)} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                  )}
                </div>
          </div>
                ) : (
                <div className="space-y-4">
                    {profile ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Business Name</Label>
                            <p className="text-lg font-semibold">{profile.businessName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Business Type</Label>
                            <p className="text-lg">{profile.businessType}</p>
                        </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Category</Label>
                            <p className="text-lg">{profile.category}</p>
                      </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Phone</Label>
                            <p className="text-lg flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4" />
                              {profile.phone}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Product Categories</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {profile.productCategories?.map((category, index) => (
                              <Badge key={index} variant="secondary">{category}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Location</Label>
                          <LocationDisplay userRole="supplier" location={profile.location} onLocationUpdate={handleLocationUpdate} />
                      </div>

                        {/* Reviews Section */}
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Reviews & Ratings</Label>
                          <div className="mt-2 space-y-4">
                            {/* Rating Summary */}
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-lg">{profile.rating?.average?.toFixed(1) || '0.0'}</span>
                                <span className="text-gray-600">({profile.rating?.count || 0} reviews)</span>
                              </div>
                              {reviews.length > 0 && (
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    <span>{reviews.filter(r => r.isTrusted).length} trusted</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                    <span>{reviews.filter(r => !r.isTrusted).length} not trusted</span>
                                  </div>
                        </div>
                      )}
                            </div>
                            
                            {/* Reviews List */}
                            {reviews.length > 0 ? (
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {reviews.slice(0, 5).map((review) => (
                                  <div key={review._id} className="p-3 border rounded-lg">
                                    {/* Vendor Details Header */}
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-sm">{review.vendorName}</span>
                                          <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={`w-3 h-3 ${
                                                  i < review.rating 
                                                    ? 'fill-yellow-400 text-yellow-400' 
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                          <Badge 
                                            variant={review.isTrusted ? "default" : "destructive"}
                                            className="text-xs"
                                          >
                                            {review.isTrusted ? "Trusted" : "Not Trusted"}
                                          </Badge>
                                        </div>
                                        {review.vendorEmail && (
                                          <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {review.vendorEmail}
                                          </p>
                                        )}
                                      </div>
                                      {review.orderAmount && (
                                        <div className="text-right">
                                          <span className="text-xs text-gray-500">Order: ₹{review.orderAmount}</span>
                        </div>
                      )}
                    </div>
                                    
                                    {/* Review Comment */}
                                    <div className="mb-2">
                                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                                    
                                    {/* Review Footer */}
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                      <span>Rating: {review.rating}/5</span>
                                    </div>
                                  </div>
                                ))}
                                {reviews.length > 5 && (
                                  <p className="text-xs text-gray-500 text-center">
                                    Showing 5 of {reviews.length} reviews
                                  </p>
                  )}
                </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No reviews yet</p>
          </div>
                            )}
        </div>
      </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No business profile found. Create one to get started.</p>
                        <Button onClick={() => setIsCreating(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Profile
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Materials</span>
                  <Button onClick={() => setIsAddingMaterial(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAddingMaterial && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4">Add New Material</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="materialName">Material Name</Label>
            <Input
                          id="materialName"
                          value={materialForm.name}
                          onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                          placeholder="Enter material name"
                        />
          </div>
                      <div>
                        <Label htmlFor="materialCategory">Category</Label>
              <Input
                          id="materialCategory"
                          value={materialForm.category}
                          onChange={(e) => setMaterialForm({...materialForm, category: e.target.value})}
                          placeholder="Enter category"
                        />
                      </div>
                      <div>
                        <Label htmlFor="materialPrice">Price</Label>
                        <Input
                          id="materialPrice"
                type="number"
                          value={materialForm.price}
                          onChange={(e) => setMaterialForm({...materialForm, price: parseFloat(e.target.value)})}
                          placeholder="Enter price"
                        />
            </div>
                      <div>
                        <Label htmlFor="materialQuantity">Quantity</Label>
              <Input
                          id="materialQuantity"
                type="number"
                          value={materialForm.quantity}
                          onChange={(e) => setMaterialForm({...materialForm, quantity: parseInt(e.target.value)})}
                          placeholder="Enter quantity"
                        />
            </div>
                      <div>
                        <Label htmlFor="materialUnit">Unit</Label>
                        <Input
                          id="materialUnit"
                          value={materialForm.unit}
                          onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
                          placeholder="e.g., kg, tons, pieces"
                        />
          </div>
                      <div>
                        <Label htmlFor="materialMinOrder">Minimum Order Quantity</Label>
            <Input
                          id="materialMinOrder"
                          type="number"
                          value={materialForm.minimumOrderQuantity}
                          onChange={(e) => setMaterialForm({...materialForm, minimumOrderQuantity: parseInt(e.target.value)})}
                          placeholder="Enter minimum order quantity"
                        />
          </div>
                    </div>
                    <div>
                      <Label htmlFor="materialDescription">Description</Label>
                      <Textarea
                        id="materialDescription"
                        value={materialForm.description}
                        onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                        placeholder="Enter material description"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddMaterial}>
                        <Save className="h-4 w-4 mr-2" />
                        Add Material
            </Button>
                      <Button onClick={() => setIsAddingMaterial(false)} variant="outline">
                        <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
                  </div>
                )}

                <div className="space-y-4">
                  {materials.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No materials added yet. Add your first material to get started.</p>
                    </div>
                  ) : (
                    materials.map((material) => (
                      <div key={material._id} className="border rounded-lg p-4">
                        {editingMaterial === material._id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Material Name</Label>
            <Input
                                  value={materialForm.name}
                                  onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
            />
          </div>
                              <div>
                                <Label>Category</Label>
              <Input
                                  value={materialForm.category}
                                  onChange={(e) => setMaterialForm({...materialForm, category: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Price</Label>
                                <Input
                type="number"
                                  value={materialForm.price}
                                  onChange={(e) => setMaterialForm({...materialForm, price: parseFloat(e.target.value)})}
                                />
            </div>
                              <div>
                                <Label>Quantity</Label>
              <Input
                type="number"
                                  value={materialForm.quantity}
                                  onChange={(e) => setMaterialForm({...materialForm, quantity: parseInt(e.target.value)})}
                                />
            </div>
          </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={materialForm.description}
                                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleUpdateMaterial(material._id)}>
                                <Save className="h-4 w-4 mr-2" />
                                Update
                              </Button>
                              <Button onClick={cancelEditMaterial} variant="outline">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{material.name}</h3>
                                <Badge variant={material.isAvailable ? "default" : "secondary"}>
                                  {material.isAvailable ? "Available" : "Out of Stock"}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2">{material.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Price: ${material.price}/{material.unit}</span>
                                <span>Quantity: {material.quantity} {material.unit}</span>
                                <span>Min Order: {material.minimumOrderQuantity} {material.unit}</span>
                                <span>Category: {material.category}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => startEditMaterial(material)} variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => handleDeleteMaterial(material._id)} variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Manage Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No orders yet</p>
                      <p className="text-gray-400 text-sm">Orders from vendors will appear here in real-time</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">Order #{order._id.slice(-6)}</h3>
                              <Badge variant={
                                order.status === 'approved' ? 'default' :
                                order.status === 'rejected' ? 'destructive' :
                                'secondary'
                              }>
                                {order.status}
                              </Badge>
                            </div>
                            
                            {/* Vendor Details */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <h4 className="font-medium text-gray-900 mb-2">Vendor Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span>{order.vendorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span>{order.vendorEmail}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PhoneIcon className="h-4 w-4 text-gray-500" />
                                  <span>{order.vendorPhone}</span>
                                </div>
                                {order.vendorLocation && (
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4 text-gray-500" />
                                    <span>{order.vendorLocation.address || `${order.vendorLocation.lat}, ${order.vendorLocation.lng}`}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
          <div className="space-y-2">
                                {order.items.map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span>{item.itemName} x {item.quantity} {item.unit}</span>
                                    <span className="font-medium">₹{item.totalPrice}</span>
                                  </div>
                                ))}
                              </div>
          </div>

                            {/* Order Summary */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="space-y-1">
                                <p><span className="font-medium">Total:</span> ₹{order.totalAmount}</p>
                                <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                                {order.deliveryAddress && (
                                  <p><span className="font-medium">Delivery:</span> {order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for Pending Orders */}
                        {order.status === 'pending' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button 
                              onClick={() => handleApproveOrder(order._id)}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Order
            </Button>
            <Button
                              onClick={() => handleRejectOrder(order._id)}
                              variant="destructive"
              className="flex-1"
            >
                              <X className="h-4 w-4 mr-2" />
                              Reject Order
            </Button>
          </div>
                        )}

                        {/* Action Buttons for Paid Orders */}
                        {order.status === 'paid' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button 
                              onClick={() => handleDispatchOrder(order._id)}
                              className="flex-1 bg-orange-600 hover:bg-orange-700"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Dispatch Order
                            </Button>
                          </div>
                        )}

                        {/* Status History */}
                        {order.statusHistory && order.statusHistory.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h4 className="font-medium text-gray-900 mb-2">Status History</h4>
                            <div className="space-y-1">
                              {order.statusHistory.map((status: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className={`w-2 h-2 rounded-full ${
                                    status.status === 'approved' ? 'bg-green-500' :
                                    status.status === 'rejected' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`}></div>
                                  <span className="capitalize">{status.status}</span>
                                  <span>•</span>
                                  <span>{new Date(status.timestamp).toLocaleString()}</span>
                                  {status.note && (
                                    <>
                                      <span>•</span>
                                      <span>{status.note}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupplierDashboard;