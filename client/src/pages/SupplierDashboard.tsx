import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useApp, SupplierItem } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Bell, Check, X, Phone, Mail } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Modal from '@/components/ui/modal';
import { initAnimations, cleanupAnimations } from '@/lib/gsap';

interface ItemFormData {
  name: string;
  price: number;
  category: string;
  stock: number;
}

const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const { suppliers, vendorRequests, addSupplierItem, updateSupplierItem, deleteSupplierItem, updateRequestStatus } = useApp();
  const { toast } = useToast();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierItem | null>(null);

  useEffect(() => {
    initAnimations();
    return () => cleanupAnimations();
  }, []);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ItemFormData>();

  // Get current supplier's data
  const currentSupplier = suppliers.find(s => s.id === user?.id) || suppliers[0]; // Fallback to first supplier for demo
  const currentRequests = vendorRequests.filter(r => r.supplierId === currentSupplier?.id);

  const onAddItem = (data: ItemFormData) => {
    addSupplierItem(currentSupplier.id, data);
    setIsAddModalOpen(false);
    reset();
    toast({
      title: "Item Added",
      description: "Your item has been added to inventory successfully.",
    });
  };

  const onEditItem = (data: ItemFormData) => {
    if (editingItem) {
      updateSupplierItem(editingItem.id, data);
      setIsEditModalOpen(false);
      setEditingItem(null);
      reset();
      toast({
        title: "Item Updated",
        description: "Your item has been updated successfully.",
      });
    }
  };

  const handleEditClick = (item: SupplierItem) => {
    setEditingItem(item);
    setValue('name', item.name);
    setValue('price', item.price);
    setValue('category', item.category);
    setValue('stock', item.stock);
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteSupplierItem(itemId);
    toast({
      title: "Item Deleted",
      description: "Item has been removed from your inventory.",
    });
  };

  const handleRequestAction = (requestId: string, action: 'accepted' | 'rejected') => {
    updateRequestStatus(requestId, action);
    toast({
      title: action === 'accepted' ? "Request Accepted" : "Request Rejected",
      description: `The vendor request has been ${action}.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Supplier Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {currentSupplier?.name}! Manage your inventory and vendor requests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inventory Section */}
          <div className="space-y-6">
            <Card className="dashboard-card shadow-xl rounded-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      My Inventory
                    </CardTitle>
                    <CardDescription>
                      Manage your available products and stock
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentSupplier?.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm font-medium text-primary">${item.price}</span>
                          <span className="text-sm text-muted-foreground">Stock: {item.stock}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {currentSupplier?.items.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No items in inventory yet.</p>
                      <p className="text-sm text-muted-foreground">Add your first item to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Section */}
          <div className="space-y-6">
            <Card className="dashboard-card shadow-xl rounded-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Vendor Requests
                </CardTitle>
                <CardDescription>
                  Review and respond to vendor purchase requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{request.vendorName}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {request.vendorEmail}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {request.vendorPhone}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-medium text-foreground">Requested Items:</h4>
                        {request.items.map((item, index) => (
                          <div key={index} className="text-sm text-muted-foreground flex justify-between">
                            <span>{item.itemName} × {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="text-sm font-medium text-foreground flex justify-between">
                            <span>Total:</span>
                            <span>${request.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'accepted')}
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestAction(request.id, 'rejected')}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="text-center py-2">
                          <p className="text-sm text-green-600 font-medium">
                            ✓ Order has been accepted and vendor has been notified
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {currentRequests.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No vendor requests yet.</p>
                      <p className="text-sm text-muted-foreground">Requests will appear here when vendors place orders.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          reset();
        }}
        title="Add New Item"
        description="Add a new product to your inventory"
      >
        <form onSubmit={handleSubmit(onAddItem)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              {...register('name', { required: 'Product name is required' })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                {...register('stock', { 
                  required: 'Stock is required',
                  min: { value: 0, message: 'Stock cannot be negative' }
                })}
              />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="Enter category"
              {...register('category', { required: 'Category is required' })}
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              Add Item
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
          reset();
        }}
        title="Edit Item"
        description="Update your product information"
      >
        <form onSubmit={handleSubmit(onEditItem)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name</Label>
            <Input
              id="edit-name"
              placeholder="Enter product name"
              {...register('name', { required: 'Product name is required' })}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                placeholder="0"
                {...register('stock', { 
                  required: 'Stock is required',
                  min: { value: 0, message: 'Stock cannot be negative' }
                })}
              />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Input
              id="edit-category"
              placeholder="Enter category"
              {...register('category', { required: 'Category is required' })}
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              Update Item
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
                reset();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
      
      <Footer />
    </div>
  );
};

export default SupplierDashboard;