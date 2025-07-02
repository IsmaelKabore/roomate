// src/components/InteractiveMap.tsx
'use client';

import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/lib/mapsConfig';

interface InteractiveMapProps {
  lat: number;
  lng: number;
}

export default function InteractiveMap({ lat, lng }: InteractiveMapProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is missing');
  }
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) {
    return (
      <div className="h-64 flex items-center justify-center bg-white">
        <p>Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      center={{ lat, lng }}
      zoom={12}
      mapContainerStyle={{ width: '100%', height: '400px' }}
    >
      <Marker position={{ lat, lng }} />
    </GoogleMap>
  );
}
