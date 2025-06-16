// src/app/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Home, Users, MapPin } from 'lucide-react';
import { getRoomPosts, RoomPost } from '@/lib/firestorePosts';
import {
  GoogleMap,
  useJsApiLoader,
} from '@react-google-maps/api';
import { CircularProgress } from '@mui/material';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface GeocodedRoom extends RoomPost {
  lat: number;
  lng: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  // 1) State: all rooms from Firestore
  const [rooms, setRooms] = useState<RoomPost[]>([]);
  // 2) State: last 3 rooms for “Featured Rooms”
  const [featured, setFeatured] = useState<RoomPost[]>([]);
  // 3) Loading flag for rooms
  const [loadingRooms, setLoadingRooms] = useState(true);

  // 4) Load Google Maps JS
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  // 5) Hidden ref to map (in case you want to access map instance later)
  const mapRef = useRef<google.maps.Map | null>(null);

  // ────────────────────────────────────────────────────────────────────────────
  // FETCH ROOMS FROM FIRESTORE
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const fetched: RoomPost[] = await getRoomPosts();
        // Sort by createdAt descending (most recent first)
        const sorted = fetched.sort((a, b) => {
          const aMillis = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bMillis = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bMillis - aMillis;
        });
        setRooms(sorted);
        setFeatured(sorted.slice(0, 3));
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* ===========================================================
           1) HERO SECTION (image occupies top 50vh)
         =========================================================== */}
      <section className="relative w-full h-[50vh]">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <Image
            src="/ROOMATES.png"
            alt="Roommates image"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          {/* Semi-transparent overlay for text legibility */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Hero Text (white with drop-shadow) */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg leading-tight">
            Sharespace
          </h1>
          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-lg max-w-2xl">
            we match student looking for roommate <br className="hidden sm:block" /> automatically 
            with verified rooms and roommates
          </p>
          <Link
            href="/discover"
            className="mt-8 inline-block rounded-full border-2  bg-blue-200 px-6 py-3 text-white text-lg font-semibold shadow-lg hover:bg-blue-600 transition"
          >
            Explore Rooms
          </Link>
        </div>

        {/* Wave Divider (SVG) */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 80"
            className="relative block w-[calc(100%+1.3px)] h-[80px]"
          >
            <path
              d="M0,32 C360,96 720,0 1080,32 L1440,0 L1440,80 L0,80 Z"
              fill="#EFF6FF"
            />
          </svg>
        </div>
      </section>

      {/* ===========================================================
           2) FEATURES SECTION
         =========================================================== */}
      <section className="py-16 bg-blue-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Why Choose Sharespace?
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600 mb-12">
            We simplify your search. Verified listings, secure in-app chat, and
            an interactive map help you find a roommate or room that fits your
            lifestyle.
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Personalized Matches
              </h3>
              <p className="text-gray-600">
                Complete a quick profile survey—get paired with roommates who
                share your habits and interests.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
              <Home className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Verified Listings
              </h3>
              <p className="text-gray-600">
                All rooms are vetted by our team. You see honest photos and
                accurate rent details—no surprises.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
              <MapPin className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Interactive Map Search
              </h3>
              <p className="text-gray-600">
                Explore neighborhoods visually—zoom, pan, and view the area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
           3) FEATURED LISTINGS (last 3 rooms)
           ─── “View Details” BUTTON REMOVED ───
         =========================================================== */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
            Featured Rooms
          </h2>
          <p className="text-gray-600 text-center mx-auto max-w-2xl mb-8">
            Here are the three most recent rooms uploaded to Sharespace.
          </p>

          {loadingRooms ? (
            <div className="flex justify-center">
              <CircularProgress />
            </div>
          ) : featured.length === 0 ? (
            <p className="text-center text-gray-600">No available rooms yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative w-full h-48">
                    <img
                      src={
                        room.images && room.images.length > 0
                          ? room.images[0]
                          : 'https://via.placeholder.com/400x240?text=No+Image'
                      }
                      alt={room.title || 'Room Image'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {room.title || 'Untitled Room'}
                    </h3>
                    <p className="text-blue-600 font-bold mb-2">
                      {typeof room.price === 'number'
                        ? `$${room.price}/mo`
                        : 'Contact for price'}
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                      {room.description?.slice(0, 60) + '...'}
                    </p>
                    {/* “View Details” button REMOVED */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===========================================================
           4) ABOUT SECTION – CTA CHANGED TO “Sign Up Now”
         =========================================================== */}
      <section className="py-16 bg-blue-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 lg:flex-row lg:gap-24 lg:px-8">
          {/* Left: Illustrative graphic (placeholder) */}
          <div className="relative w-full max-w-md flex-shrink-0">
            <img
              src="public\ROOMIES.jpg"
              alt="About Sharespace"
              className="rounded-xl shadow-lg object-cover w-full h-full"
            />
          </div>

          {/* Right: Text */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              About Sharespace
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl">
              Sharespace is the easiest way to find a roommate or room near
              you. Whether you’re a student, a young professional, or just want
              to split rent, our smart matching engine pairs you with
              compatible roommates and verified rooms—no hassles, no scams.
            </p>
            <ul className="space-y-3 text-gray-600 mb-8 max-w-2xl">
              <li>
                • <strong>Smart Matching:</strong> Fill out a quick profile
                survey—share your daily habits and interests. Get matched with
                someone who actually fits your lifestyle.
              </li>
              <li>
                • <strong>Verified Listings:</strong> Every room is vetted by
                our team. You see accurate photos, honest descriptions, and no
                hidden fees.
              </li>
              <li>
                • <strong>Built‐In Chat:</strong> Message potential roommates
                and landlords directly in-app—ask questions, schedule tours,
                finalize details without switching apps.
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="inline-block px-6 py-3 bg-blue-200 text-white rounded-full font-semibold hover:bg-blue-700 transition"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================================
           5) INTERACTIVE MAP SECTION (CENTERED ON BERKELEY)
         =========================================================== */}
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

      {/* ===========================================================
           6) FOOTER (with CTA)
         =========================================================== */}
      <footer className="mt-auto bg-blue-600 py-12 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to find your perfect roommate?
          </h3>
          <p className="text-lg mb-8">
            Join thousands of happy Sharespace users—create a free account and
            start searching in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition-shadow shadow-md"
          >
            <Sparkles className="w-5 h-5" />
            Sign Up Now
          </Link>

          <div className="mt-12 border-t border-white/40 pt-8 text-sm flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
            <p>© {new Date().getFullYear()} Sharespace. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
