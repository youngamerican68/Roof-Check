// Google Static Maps API URL builder
// Generates satellite imagery URLs for property visualization

interface StaticMapOptions {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  mapType?: 'satellite' | 'hybrid' | 'roadmap' | 'terrain';
  markerColor?: string;
  scale?: 1 | 2;
}

// Build a Google Static Maps URL for a property
export function buildStaticMapUrl(options: StaticMapOptions): string {
  const {
    lat,
    lng,
    zoom = 20,
    width = 600,
    height = 400,
    mapType = 'satellite',
    markerColor = 'red',
    scale = 2, // Retina display support
  } = options;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured');
    return '';
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    maptype: mapType,
    scale: scale.toString(),
    key: apiKey,
  });

  // Only add marker if color is specified (allows opting out)
  if (markerColor === 'small') {
    // Small dot marker - less obtrusive
    params.set('markers', `size:tiny|color:red|${lat},${lng}`);
  } else if (markerColor) {
    params.set('markers', `color:${markerColor}|${lat},${lng}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

// Build a URL for a wider area view (useful for context)
export function buildContextMapUrl(lat: number, lng: number): string {
  return buildStaticMapUrl({
    lat,
    lng,
    zoom: 18,
    width: 600,
    height: 300,
    mapType: 'hybrid', // Shows labels on satellite
  });
}

// Build a URL for the confirmation page (interactive-style preview)
export function buildConfirmationMapUrl(lat: number, lng: number): string {
  return buildStaticMapUrl({
    lat,
    lng,
    zoom: 19,
    width: 640,
    height: 400,
    mapType: 'satellite',
    markerColor: 'orange',
  });
}

// Build a high-resolution property image for the report
export function buildReportMapUrl(lat: number, lng: number): string {
  return buildStaticMapUrl({
    lat,
    lng,
    zoom: 20, // Closer view of the property
    width: 640,
    height: 480,
    mapType: 'satellite',
    markerColor: 'small', // Tiny marker - identifies house without obscuring roof
    scale: 2,
  });
}
