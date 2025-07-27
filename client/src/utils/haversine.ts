/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Convert degrees to radians
 * @param deg - Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Filter suppliers within a specified radius
 * @param suppliers - Array of supplier objects with location
 * @param vendorLat - Vendor's latitude
 * @param vendorLng - Vendor's longitude
 * @param maxDistance - Maximum distance in km
 * @returns Filtered suppliers within radius
 */
export function filterSuppliersByDistance(
  suppliers: any[],
  vendorLat: number,
  vendorLng: number,
  maxDistance: number = 10
): any[] {
  return suppliers.filter(supplier => {
    if (!supplier.location || !supplier.location.lat || !supplier.location.lng) {
      return false;
    }
    
    const distance = getDistanceFromLatLonInKm(
      vendorLat,
      vendorLng,
      supplier.location.lat,
      supplier.location.lng
    );
    
    return distance <= maxDistance;
  });
}

/**
 * Sort suppliers by rating (highest first)
 * @param suppliers - Array of supplier objects
 * @returns Sorted suppliers
 */
export function sortSuppliersByRating(suppliers: any[]): any[] {
  return suppliers.sort((a, b) => {
    const ratingA = a.rating?.average || 0;
    const ratingB = b.rating?.average || 0;
    return ratingB - ratingA;
  });
}

/**
 * Get suppliers within radius and sorted by rating
 * @param suppliers - Array of supplier objects
 * @param vendorLat - Vendor's latitude
 * @param vendorLng - Vendor's longitude
 * @param maxDistance - Maximum distance in km
 * @returns Filtered and sorted suppliers
 */
export function getNearbySuppliers(
  suppliers: any[],
  vendorLat: number,
  vendorLng: number,
  maxDistance: number = 10
): any[] {
  const nearbySuppliers = filterSuppliersByDistance(suppliers, vendorLat, vendorLng, maxDistance);
  return sortSuppliersByRating(nearbySuppliers);
} 