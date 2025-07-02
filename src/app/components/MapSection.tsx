'use client';

import { useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Libraries } from '@react-google-maps/api';
import { CircularProgress, Typography, Button } from '@mui/material';
import { GOOGLE_MAPS_API_KEY, MAP_LIBRARIES } from '@/lib/mapsConfig';

export default function MapSection() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps JS only when this component is rendered
  const { isLoaded: isMapLoaded, loadError } = useJsApiLoader({
    // Force a string here so TS is happy
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: [...MAP_LIBRARIES] as Libraries,
  });

  const handleRetry = () => {
    setMapError(null);
    window.location.reload();
  };

  // Check for missing API key
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Explore Berkeley On The Map
          </h2>
          <p className="text-slate-300 mx-auto max-w-2xl mb-8">
            Zoom and pan around Berkeley. This is a plain map—no pins or markers.
          </p>
        </div>

        <div className="mx-auto px-6 lg:px-8 h-[500px]">
          <div className="dark-card h-full flex items-center justify-center flex-col gap-4">
            <Typography
              sx={{ color: 'var(--foreground-secondary)', textAlign: 'center' }}
            >
              🗺️ Map configuration needed
            </Typography>
            <Typography
              sx={{
                color: 'var(--foreground-secondary)',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              Google Maps API key not found. Please check your environment configuration.
            </Typography>
          </div>
        </div>
      </section>
    );
  }

  // Handle load errors
  if (loadError || mapError) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Explore Berkeley On The Map
          </h2>
          <p className="text-slate-300 mx-auto max-w-2xl mb-8">
            Zoom and pan around Berkeley. This is a plain map—no pins or markers.
          </p>
        </div>

        <div className="mx-auto px-6 lg:px-8 h-[500px]">
          <div className="dark-card h-full flex items-center justify-center flex-col gap-4">
            <Typography
              sx={{ color: '#ef4444', textAlign: 'center', fontWeight: 600 }}
            >
              ⚠️ Map Loading Error
            </Typography>
            <Typography
              sx={{
                color: 'var(--foreground-secondary)',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              {mapError || 'Unable to load Google Maps. Please check your internet connection.'}
            </Typography>
            <Button
              onClick={handleRetry}
              className="btn-primary"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '12px',
                px: 3,
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Explore Berkeley On The Map
        </h2>
        <p className="text-slate-300 mx-auto max-w-2xl mb-8">
          Zoom and pan around Berkeley. This is a plain map—no pins or markers.
        </p>
      </div>

      <div className="mx-auto px-6 lg:px-8 h-[500px]">
        {!isMapLoaded ? (
          <div className="dark-card h-full flex items-center justify-center flex-col gap-4">
            <CircularProgress sx={{ color: 'var(--primary)' }} size={48} />
            <Typography sx={{ color: 'var(--foreground-secondary)', textAlign: 'center' }}>
              Loading Berkeley map...
            </Typography>
          </div>
        ) : (
          <div className="dark-card h-full overflow-hidden">
            <GoogleMap
              center={{ lat: 37.8715, lng: -122.2730 }} // Berkeley, CA
              zoom={13}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              options={{
                styles: [
                  // Dark theme map styling
                  {
                    featureType: 'all',
                    elementType: 'geometry',
                    stylers: [{ color: '#242f3e' }],
                  },
                  {
                    featureType: 'all',
                    elementType: 'labels.text.stroke',
                    stylers: [{ lightness: -80 }],
                  },
                  {
                    featureType: 'administrative',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#746855' }],
                  },
                  {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }],
                  },
                  {
                    featureType: 'poi',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }],
                  },
                  {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [{ color: '#263c3f' }],
                  },
                  {
                    featureType: 'poi.park',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#6b9a76' }],
                  },
                  {
                    featureType: 'road',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#2b3544' }],
                  },
                  {
                    featureType: 'road',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#9ca5b3' }],
                  },
                  {
                    featureType: 'road.arterial',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#38414e' }],
                  },
                  {
                    featureType: 'road.arterial',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#212a37' }],
                  },
                  {
                    featureType: 'road.highway',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#746855' }],
                  },
                  {
                    featureType: 'road.highway',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#1f2835' }],
                  },
                  {
                    featureType: 'road.highway',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#f3d19c' }],
                  },
                  {
                    featureType: 'road.local',
                    elementType: 'geometry.fill',
                    stylers: [{ color: '#38414e' }],
                  },
                  {
                    featureType: 'road.local',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#212a37' }],
                  },
                  {
                    featureType: 'transit',
                    elementType: 'geometry',
                    stylers: [{ color: '#2f3948' }],
                  },
                  {
                    featureType: 'transit.station',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }],
                  },
                  {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#17263c' }],
                  },
                  {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#515c6d' }],
                  },
                  {
                    featureType: 'water',
                    elementType: 'labels.text.stroke',
                    stylers: [{ lightness: -20 }],
                  },
                ],
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
