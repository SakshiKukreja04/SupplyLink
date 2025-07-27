import fetch from 'node-fetch';

/**
 * Reverse geocoding - get address from coordinates
 */
export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SupplyLink/1.0 (https://supplylink.com; contact@supplylink.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      address: data.display_name,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      details: data.address
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Failed to get address from coordinates' });
  }
}; 