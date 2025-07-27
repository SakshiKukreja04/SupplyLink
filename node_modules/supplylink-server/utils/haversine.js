/**
 * Calculate the distance between two points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
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
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Filter suppliers within a specified radius
 * @param {Array} suppliers - Array of supplier objects with location
 * @param {number} vendorLat - Vendor's latitude
 * @param {number} vendorLng - Vendor's longitude
 * @param {number} maxDistance - Maximum distance in km
 * @returns {Array} Filtered suppliers within radius
 */
export function filterSuppliersByDistance(suppliers, vendorLat, vendorLng, maxDistance = 10) {
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
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Array} Sorted suppliers
 */
export function sortSuppliersByRating(suppliers) {
  return suppliers.sort((a, b) => {
    const ratingA = a.rating?.average || 0;
    const ratingB = b.rating?.average || 0;
    return ratingB - ratingA;
  });
}

/**
 * Get suppliers within radius and sorted by rating
 * @param {Array} suppliers - Array of supplier objects
 * @param {number} vendorLat - Vendor's latitude
 * @param {number} vendorLng - Vendor's longitude
 * @param {number} maxDistance - Maximum distance in km
 * @returns {Array} Filtered and sorted suppliers
 */
export function getNearbySuppliers(suppliers, vendorLat, vendorLng, maxDistance = 10) {
  const nearbySuppliers = filterSuppliersByDistance(suppliers, vendorLat, vendorLng, maxDistance);
  return sortSuppliersByRating(nearbySuppliers);
} 