import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { latitude, longitude, radius = 10000 } = body;

    if (!latitude || !longitude) {
      return Response.json({ error: 'latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Use Places API (New) Nearby Search
    const placesUrl = 'https://places.googleapis.com/v1/places:searchNearby';

    const requestBody = {
      includedTypes: ['car_repair', 'auto_parts_store'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
          radius: parseFloat(radius),
        },
      },
    };

    const response = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.regularOpeningHours,places.websiteUri,places.location,places.businessStatus,places.types',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: `Google Places API error: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const places = data.places || [];

    // Calculate distance from user location
    const toRad = (val: number) => (val * Math.PI) / 180;
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 3958.8; // miles
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return (R * c).toFixed(1);
    };

    const shops = places.map((place: any) => {
      const shopLat = place.location?.latitude;
      const shopLon = place.location?.longitude;
      const distance =
        shopLat && shopLon
          ? haversineDistance(parseFloat(latitude), parseFloat(longitude), shopLat, shopLon)
          : null;

      // Check if open now
      const isOpen = place.regularOpeningHours?.openNow ?? null;

      return {
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || 'Address not available',
        phone: place.nationalPhoneNumber || null,
        rating: place.rating || null,
        total_ratings: place.userRatingCount || 0,
        is_open: isOpen,
        website: place.websiteUri || null,
        distance_miles: distance,
        business_status: place.businessStatus || 'OPERATIONAL',
        types: place.types || [],
      };
    });

    // Sort by distance
    shops.sort((a: any, b: any) => {
      if (a.distance_miles === null) return 1;
      if (b.distance_miles === null) return -1;
      return parseFloat(a.distance_miles) - parseFloat(b.distance_miles);
    });

    return Response.json({
      success: true,
      shops,
      total: shops.length,
      search_location: { latitude, longitude },
      radius_meters: radius,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
