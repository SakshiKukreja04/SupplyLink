import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/utils/api';

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
              const endpoint = userRole === 'supplier' ? 'api/suppliers/location' : 'api/vendors/location';
              const response = await apiCall(endpoint, {
                method: 'PATCH',
                headers: { 
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
              const endpoint = userRole === 'supplier' ? 'api/suppliers/location' : 'api/vendors/location';
              const response = await apiCall(endpoint, {
                method: 'PATCH',
                headers: { 
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Getting your location...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={getCurrentLocation} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : location ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Location</p>
                <p className="text-sm text-gray-600">
                  {address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                </p>
              </div>
              <Button onClick={getCurrentLocation} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}
              </div>
              <div>
                <span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Location not available</p>
            <Button onClick={getCurrentLocation}>
              <MapPin className="h-4 w-4 mr-2" />
              Get Location
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationDisplay; 