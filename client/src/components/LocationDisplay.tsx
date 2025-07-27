import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LocationDisplayProps {
  userRole: 'vendor' | 'supplier';
  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  onLocationUpdate?: (location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }) => void;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ userRole, location: propLocation, onLocationUpdate }) => {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with prop location if available
  useEffect(() => {
    if (propLocation && propLocation.lat && propLocation.lng) {
      setLocation({ lat: propLocation.lat, lng: propLocation.lng });
      setAddress(propLocation.address || '');
    }
  }, [propLocation]);

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            address: data.display_name || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            country: data.address?.country || 'India',
            zipCode: data.address?.postcode || ''
          };

          setAddress(locationData.address);

          // Call parent callback if provided
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }

          // Update location in backend
          try {
            if (firebaseUser) {
              const token = await firebaseUser.getIdToken();
              const endpoint = userRole === 'supplier' ? '/api/suppliers/location' : '/api/vendors/location';
              const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(locationData)
              });

              if (response.ok) {
                toast({
                  title: "Location Updated",
                  description: "Your location has been saved successfully.",
                });
              } else {
                throw new Error('Failed to update location');
              }
            }
          } catch (e) {
            console.error('Failed to update location in backend:', e);
            toast({
              title: "Location Update Failed",
              description: "Failed to save your location. Please try again.",
              variant: "destructive"
            });
          }
        } catch (e) {
          console.log('Failed to get address:', e);
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            address: '',
            city: '',
            state: '',
            country: 'India',
            zipCode: ''
          };

          // Call parent callback if provided
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }
          
          // Still try to update location even if geocoding fails
          try {
            if (firebaseUser) {
              const token = await firebaseUser.getIdToken();
              const endpoint = userRole === 'supplier' ? '/api/suppliers/location' : '/api/vendors/location';
              const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(locationData)
              });

              if (response.ok) {
                toast({
                  title: "Location Updated",
                  description: "Your location has been saved successfully.",
                });
              } else {
                throw new Error('Failed to update location');
              }
            }
          } catch (backendError) {
            console.error('Failed to update location in backend:', backendError);
            toast({
              title: "Location Update Failed",
              description: "Failed to save your location. Please try again.",
              variant: "destructive"
            });
          }
        }

        setLoading(false);
      },
      (err) => {
        setError('Unable to retrieve your location. Please check your browser permissions.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Get location on component mount if no prop location
  useEffect(() => {
    if (!propLocation || !propLocation.lat || !propLocation.lng) {
      getCurrentLocation();
    }
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Your Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Getting your location...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {location && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Coordinates:</span>
              <div className="text-muted-foreground">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            </div>
            
            {address && (
              <div className="text-sm">
                <span className="font-medium">Address:</span>
                <div className="text-muted-foreground">{address}</div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              This location helps {userRole === 'vendor' ? 'suppliers find you' : 'vendors find you'} for better service.
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Location
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LocationDisplay; 