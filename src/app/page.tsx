// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Sparkles, Home, Users, MapPin } from 'lucide-react';
import { getFeaturedRoomPosts, RoomPost } from '@/lib/firestorePosts';
import { CircularProgress } from '@mui/material';

// Lazy load the map component since it's at the bottom of the page
const LazyMapSection = dynamic(() => import('./components/MapSection'), {
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-white">
      <CircularProgress sx={{ color: '#007AFF' }} />
    </div>
  ),
  ssr: false, // Don't render on server since it needs browser APIs
});

export default function HomePage() {
  const [featured, setFeatured] = useState<RoomPost[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const featuredRooms = await getFeaturedRoomPosts(3);
        if (!isMounted) return;
        setFeatured(featuredRooms);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        if (isMounted) setFeatured([]);
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ===========================================================
           1) HERO SECTION - Light Theme
      =========================================================== */}
      <section className="relative pt-20 pb-16 px-6 lg:px-8 overflow-hidden">
        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Left: Hero Text */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                  Discover your ideal{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                    roommate
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
                  ShareSpace.Ai brings you to the perfect roomates in seconds!
                </p>
              </div>

              <div className="flex flex-row flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="/discover"
                  className="
                    group relative inline-flex
                    items-center gap-3
                    px-6 sm:px-10     /* reduced horizontal padding on mobile */
                    py-4
                    bg-gradient-to-r from-blue-500 to-blue-600
                    text-white
                    rounded-2xl
                    text-base sm:text-lg   /* smaller font on mobile */
                    font-bold
                    transition-all duration-300
                    shadow-xl hover:shadow-blue-500/40 hover:-translate-y-2
                    overflow-hidden
                  "
                  prefetch={true}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 font-semibold tracking-wide text-white">
                    Search
                  </span>
                  <div className="
                    absolute inset-0 -top-40
                    bg-gradient-to-b from-white/20 to-transparent
                    w-full h-full
                    transform rotate-12 translate-x-[-100%]
                    group-hover:translate-x-[100%]
                    transition-transform duration-700
                  "></div>
                </Link>

                <Link
                  href="/auth/signup"
                  className="
                    group relative inline-flex
                    items-center gap-3
                    px-6 sm:px-10
                    py-4
                    bg-white
                    border-2 border-gray-200
                    text-gray-900
                    rounded-2xl
                    text-base sm:text-lg
                    font-semibold
                    hover:bg-gray-50
                    transition-all duration-300
                    shadow-lg hover:shadow-gray-300/30
                  "
                  prefetch={true}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300"></span>
                  <span className="font-semibold tracking-wide">Sign Up</span>
                </Link>
              </div>
            </div>

            {/* Right: Hero Image with floating cards */}
            <div className="relative">
              <div className="relative w-full max-w-md mx-auto h-96 lg:h-[500px]">
                <Image
                  src="/ROOMATES.png"
                  alt="Find your perfect roommate"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-2xl shadow-2xl"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                  priority
                />
              </div>

              <div className="absolute -bottom-6 -left-4 lg:-left-8 w-48 h-32 bg-white rounded-2xl p-4 border border-gray-200 shadow-lg">
                <div className="text-gray-900">
                  <div className="text-sm text-gray-600">Berkeley, CA</div>
                  <div className="text-xl font-bold text-blue-400">$600/month</div>
                </div>
              </div>

              <div className="absolute -top-6 -right-4 lg:-right-8 w-48 h-32 bg-white rounded-2xl p-4 border border-gray-200 shadow-lg">
                <div className="text-gray-900">
                  <div className="text-sm text-gray-600">Oakland, CA</div>
                  <div className="text-xl font-bold text-blue-400">$850/month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
           2) FEATURES SECTION - Light Theme Cards
      =========================================================== */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ShareSpace?</h2>

          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg group hover:scale-105 transition-all duration-500">
              <Users className="w-12 h-12 text-blue-400 mb-6 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personalized Matches</h3>
              <p className="text-gray-600 leading-relaxed">
                Fill out the Description and get paired with roommates who
                share your habits and interests.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg group hover:scale-105 transition-all duration-500">
              <Home className="w-12 h-12 text-blue-400 mb-6 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Verified Listings</h3>
              <p className="text-gray-600 leading-relaxed">
                All rooms are vetted by our team. Honest photos and
                accurate rent details. No surprises!
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg group hover:scale-105 transition-all duration-500">
              <MapPin className="w-12 h-12 text-blue-400 mb-6 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Interactive Map Search</h3>
              <p className="text-gray-600 leading-relaxed">
                Explore neighborhoods visually zoom, pan, and view the area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
           3) FEATURED LISTINGS - Light Theme
      =========================================================== */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Rooms</h2>
            <p className="text-gray-600 mx-auto max-w-2xl">
              Here are the most recent rooms uploaded to ShareSpace.
            </p>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl overflow-hidden shadow animate-pulse"
                  style={{ animationDelay: `${index * 100}ms`, animationDuration: '1.5s' }}
                >
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
              <div className="text-gray-500 text-8xl mb-6">🏠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms available yet</h3>
              <p className="text-gray-600">Check back soon for new listings!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((room, index) => (
                <div
                  key={room.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg opacity-0 animate-[slideUp_0.6s_ease-out_forwards] will-change-transform"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={
                        room.images && room.images.length > 0
                          ? room.images[0]
                          : 'https://via.placeholder.com/400x240?text=No+Image'
                      }
                      alt={room.title || 'Room Image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={75}
                      className="object-cover transition-all duration-700 ease-out group-hover:scale-110 opacity-0"
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.opacity = '1';
                        const placeholder = target.previousElementSibling as HTMLElement;
                        if (placeholder) { placeholder.style.opacity = '0'; setTimeout(() => placeholder.remove(), 300); }
                      }}
                      priority={index === 0}
                    />
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 leading-tight">
                        {room.title || 'Untitled Room'}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-400 font-bold text-lg">
                          {typeof room.price === 'number'
                            ? `$${room.price.toLocaleString()}/mo`
                            : 'Contact for price'}
                        </p>
                        {room.address && (
                          <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 transition-colors duration-200 group-hover:bg-blue-500/20 group-hover:border-blue-400/50 group-hover:text-blue-300">
                            📍 {room.address.split(',')[0]?.trim()}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {room.description || 'No description available.'}
                    </p>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          ⏰ {room.createdAt?.toDate
                            ? new Date(room.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Recently added'}
                        </span>
                        <Link
                          href={`/discover/rooms`}
                          className="group/link relative inline-flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-blue-400/50 text-blue-400 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-blue-400 hover:text-white hover:border-blue-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-400/25 overflow-hidden"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300"></span>
                          <span className="relative z-10">View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===========================================================
     4) ABOUT SECTION – Light Theme (boxed layout)
      =========================================================== */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-12 lg:flex-row lg:gap-24">
          
          {/* ─── Image Box ─── */}
          <div className="w-full max-w-md h-80 relative flex-shrink-0 
                          bg-gray-50 rounded-xl shadow-lg overflow-hidden">
            <Image
              src="/ROOMIES.jpg"
              alt="People sharing a living space"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={80}
            />
          </div>

          {/* ─── Text Box ─── */}
          <div className="w-full bg-gray-50 rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About ShareSpace</h2>
            <p className="text-gray-600 mb-8 max-w-2xl text-lg leading-relaxed">
              ShareSpace is the easiest way to find a roommate or room near
              you. Whether you’re a student, or just want to split rent,
              our smart matching engine pairs you with compatible roommates
              and verified rooms.
            </p>
            <ul className="space-y-4 text-gray-600 max-w-2xl">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Smart Matching:</strong> Fill out a quick description, share your daily habits and interests, and get matched with someone who actually fits your lifestyle.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Verified Listings:</strong> Every room is vetted by our team so you see accurate photos, honest descriptions, and no hidden fees.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Built-In Chat:</strong> Message potential roommates and landlords directly in-app, ask questions, schedule tours, and finalize details without switching apps.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>


      {/* ===========================================================
           5) LAZY LOADED MAP SECTION
      =========================================================== */}
      <LazyMapSection />

      {/* ===========================================================
           6) FOOTER - Light Theme
      =========================================================== */}
      <footer className="mt-auto bg-white py-12 text-gray-700 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Ready to find your perfect roommate?</h3>
          <p className="text-lg mb-8 text-gray-600">
            Join thousands of happy ShareSpace users, create a free account and
            start searching in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-xl font-bold transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-3 overflow-hidden"
            prefetch={true}
          >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative z-10 font-semibold tracking-wide text-white">Sign Up Now</span>
          </Link>

          <div className="mt-12 border-t border-gray-200 pt-8 text-sm flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
            <p>
              © {year !== null ? year : ''} ShareSpace. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <Link href="/terms" className="hover:text-blue-400 transition-colors duration-200 hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-blue-400 transition-colors duration-200 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
