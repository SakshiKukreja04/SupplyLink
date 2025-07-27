import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue in Leaflet + Webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

interface Supplier {
  _id: string;
  name: string;
  email?: string;
  businessName?: string;
  businessType?: string;
  productCategories?: string[];
  location: {
    lat: number;
    lng: number;
  };
  rating?: {
    average: number;
    count: number;
  };
  [key: string]: any;
}

const VendorMap: React.FC = () => {
  const [vendorLocation, setVendorLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [nearbySuppliers, setNearbySuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get vendor's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVendorLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError('Unable to retrieve your location.');
        setLoading(false);
      }
    );
  }, []);

  // Fetch all suppliers from backend
  useEffect(() => {
    if (!vendorLocation) return;
    setLoading(true);
    fetch('/api/suppliers/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers);
        } else {
          setError('Failed to fetch suppliers.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch suppliers.');
        setLoading(false);
      });
  }, [vendorLocation]);

  // Filter suppliers within 10km
  useEffect(() => {
    if (!vendorLocation || suppliers.length === 0) return;
    const filtered = suppliers.filter((s) => {
      if (!s.location || typeof s.location.lat !== 'number' || typeof s.location.lng !== 'number') return false;
      const dist = getDistanceFromLatLonInKm(
        vendorLocation.lat,
        vendorLocation.lng,
        s.location.lat,
        s.location.lng
      );
      return dist <= 10;
    });
    setNearbySuppliers(filtered);
  }, [vendorLocation, suppliers]);

  // Center map on vendor location
  const MapCenterer: React.FC = () => {
    const map = useMap();
    useEffect(() => {
      if (vendorLocation) {
        map.setView([vendorLocation.lat, vendorLocation.lng], 13);
      }
    }, [vendorLocation, map]);
    return null;
  };

  return (
    <div className="h-64 w-full rounded-xl shadow relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <span className="text-gray-500">Loading map...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
          <span className="text-red-500">{error}</span>
        </div>
      )}
      {vendorLocation && (
        <MapContainer
          center={[vendorLocation.lat, vendorLocation.lng]}
          zoom={13}
          scrollWheelZoom={true}
          className="h-64 w-full rounded-xl"
        >
          <MapCenterer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Vendor marker */}
          <Marker position={[vendorLocation.lat, vendorLocation.lng]}>
            <Popup>
              <div className="font-semibold">You (Vendor)</div>
              <div className="text-xs text-gray-500">Your current location</div>
            </Popup>
          </Marker>
          {/* Supplier markers */}
          {nearbySuppliers.map((supplier) => (
            <Marker
              key={supplier._id}
              position={[supplier.location.lat, supplier.location.lng]}
              eventHandlers={{
                click: () => setSelectedSupplier(supplier),
              }}
            >
              <Popup>
                <div className="font-semibold">{supplier.businessName || supplier.name}</div>
                {supplier.businessType && (
                  <div className="text-xs text-gray-600">{supplier.businessType}</div>
                )}
                {supplier.productCategories && supplier.productCategories.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Categories: {supplier.productCategories.join(', ')}
                  </div>
                )}
                {supplier.rating && (
                  <div className="text-xs text-yellow-600">
                    ⭐ {supplier.rating.average.toFixed(1)} ({supplier.rating.count} reviews)
                  </div>
                )}
                <button
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  onClick={() => alert(`Order placed with ${supplier.businessName || supplier.name}`)}
                >
                  Place Order
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default VendorMap; 