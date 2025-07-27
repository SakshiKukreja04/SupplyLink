import React, { createContext, useContext, useState } from 'react';

export interface SupplierItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  supplierId: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  reviews: number;
  location: string;
  items: SupplierItem[];
}

export interface VendorRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  supplierId: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }>;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  totalAmount: number;
}

export interface Order {
  id: string;
  vendorId: string;
  supplierId: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }>;
  status: 'pending' | 'approved' | 'paid' | 'completed';
  totalAmount: number;
  createdAt: string;
}

interface AppContextType {
  suppliers: Supplier[];
  vendorRequests: VendorRequest[];
  orders: Order[];
  addSupplierItem: (supplierId: string, item: Omit<SupplierItem, 'id' | 'supplierId'>) => void;
  updateSupplierItem: (itemId: string, updates: Partial<SupplierItem>) => void;
  deleteSupplierItem: (itemId: string) => void;
  submitVendorRequest: (request: Omit<VendorRequest, 'id' | 'createdAt'>) => void;
  updateRequestStatus: (requestId: string, status: 'accepted' | 'rejected') => void;
  searchSuppliers: (query: string) => Supplier[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Real data will be fetched from API
const mockSuppliers: Supplier[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [vendorRequests, setVendorRequests] = useState<VendorRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const addSupplierItem = (supplierId: string, item: Omit<SupplierItem, 'id' | 'supplierId'>) => {
    const newItem: SupplierItem = {
      ...item,
      id: Date.now().toString(),
      supplierId,
    };

    setSuppliers(prev =>
      prev.map(supplier =>
        supplier.id === supplierId
          ? { ...supplier, items: [...supplier.items, newItem] }
          : supplier
      )
    );
  };

  const updateSupplierItem = (itemId: string, updates: Partial<SupplierItem>) => {
    setSuppliers(prev =>
      prev.map(supplier => ({
        ...supplier,
        items: supplier.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      }))
    );
  };

  const deleteSupplierItem = (itemId: string) => {
    setSuppliers(prev =>
      prev.map(supplier => ({
        ...supplier,
        items: supplier.items.filter(item => item.id !== itemId),
      }))
    );
  };

  const submitVendorRequest = (request: Omit<VendorRequest, 'id' | 'createdAt'>) => {
    const newRequest: VendorRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setVendorRequests(prev => [...prev, newRequest]);
  };

  const updateRequestStatus = (requestId: string, status: 'accepted' | 'rejected') => {
    setVendorRequests(prev =>
      prev.map(request =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  };

  const searchSuppliers = (query: string): Supplier[] => {
    if (!query.trim()) return suppliers;
    
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(query.toLowerCase()) ||
      supplier.items.some(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        suppliers,
        vendorRequests,
        orders,
        addSupplierItem,
        updateSupplierItem,
        deleteSupplierItem,
        submitVendorRequest,
        updateRequestStatus,
        searchSuppliers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};