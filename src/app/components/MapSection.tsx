'use client';

import { useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { CircularProgress } from '@mui/material';

const MAP_LIBRARIES: ('places')[] = ['places'];

export default function MapSection() {
  const mapRef = useRef<google.maps.Map | null>(null);

  // Load Google Maps JS only when this component is rendered
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAHy9t-zxAHjbwgGlmWwl1jARFP5Ua7Q_",
    libraries: MAP_LIBRARIES,
  });

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Explore Berkeley On The Map
        </h2>
        <p className="text-gray-600 mx-auto max-w-2xl mb-8">
          Zoom and pan around Berkeley. This is a plain map—no pins or markers.
        </p>
      </div>

      <div className="mx-auto px-6 lg:px-8 h-[500px]">
        {!isMapLoaded ? (
          <div className="flex h-full items-center justify-center">
            <CircularProgress />
          </div>
        ) : (
          <GoogleMap
            center={{ lat: 37.8715, lng: -122.2730 }} // Berkeley, CA
            zoom={13}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            onLoad={(map) => {
              mapRef.current = map;
            }}
          />
        )}
      </div>
    </section>
  );
} 