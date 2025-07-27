import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Truck, 
  Package,
  AlertCircle 
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Requested':
        return {
          label: 'Requested',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          description: 'Order request sent, waiting for supplier approval'
        };
      case 'Approved':
        return {
          label: 'Approved',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          description: 'Order approved by supplier, proceed to payment'
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          description: 'Order rejected by supplier'
        };
      case 'Paid':
        return {
          label: 'Paid',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: CreditCard,
          description: 'Payment completed, waiting for dispatch'
        };
      case 'Dispatched':
        return {
          label: 'Dispatched',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Truck,
          description: 'Order dispatched, on the way'
        };
      case 'Delivered':
        return {
          label: 'Delivered',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: Package,
          description: 'Order delivered successfully'
        };
      case 'Cancelled':
        return {
          label: 'Cancelled',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
          description: 'Order cancelled'
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          description: 'Unknown status'
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`${config.color} ${sizeClasses[size]} flex items-center gap-1.5 font-medium`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {config.description}
      </span>
    </div>
  );
};

export default OrderStatusBadge; 