import React from 'react';
import { MapPin, Star, CheckCircle, Building, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';


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

interface SupplierCardProps {
  supplier: Supplier;
  onSelectSupplier: (supplier: Supplier) => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ 
  supplier, 
  onSelectSupplier
}) => {
  const { toast } = useToast();

  const renderRating = () => {
    const { average, count } = supplier.rating;
    const displayRating = average > 0 ? average.toFixed(1) : '0.0';
    const displayCount = count > 0 ? count : 0;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{displayRating}</span>
        <span className="text-muted-foreground">({displayCount} reviews)</span>
      </div>
    );
  };

  const renderDistance = () => {
    if (supplier.distance !== undefined) {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{supplier.distance.toFixed(1)} km away</span>
        </div>
      );
    }
    return null;
  };

  const renderCategories = () => {
    return (
      <div className="flex flex-wrap gap-1">
        {supplier.productCategories.slice(0, 3).map((category, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {category}
          </Badge>
        ))}
        {supplier.productCategories.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{supplier.productCategories.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {supplier.businessName}
                {supplier.isVerified && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building className="w-3 h-3" />
                <span>{supplier.businessType}</span>
              </div>
            </div>
            <div className="text-right">
              {renderRating()}
              {renderDistance()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Categories */}
          <div>
            <h4 className="text-sm font-medium mb-2">Product Categories</h4>
            {renderCategories()}
          </div>

          <Separator />

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {supplier.location.lat.toFixed(4)}, {supplier.location.lng.toFixed(4)}
            </span>
          </div>

          {/* Action Button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectSupplier(supplier)}
              className="w-full"
            >
              <Truck className="w-4 h-4 mr-2" />
              Contact
            </Button>
          </div>

          {/* Quick Stats */}
          {supplier.materials && supplier.materials.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Available Materials:</span>
                <span className="font-medium">{supplier.materials.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price Range:</span>
                <span className="font-medium">
                  ₹{Math.min(...supplier.materials.map(m => m.price))} - 
                  ₹{Math.max(...supplier.materials.map(m => m.price))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SupplierCard; 