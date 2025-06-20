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
    <div className="flex h-[500px] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <CircularProgress sx={{ color: '#007AFF' }} />
    </div>
  ),
  ssr: false, // Don't render on server since it needs browser APIs
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  // Only need featured rooms state - no need for all rooms
  const [featured, setFeatured] = useState<RoomPost[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // ────────────────────────────────────────────────────────────────────────────
  // FETCH ONLY 3 RECENT ROOMS FROM FIRESTORE (OPTIMIZED)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    (async () => {
      try {
        // Fetch only 3 featured rooms directly from Firestore
        const featuredRooms = await getFeaturedRoomPosts(3);
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        setFeatured(featuredRooms);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        if (isMounted) {
          setFeatured([]); // Set empty array on error
        }
      } finally {
        if (isMounted) {
          setLoadingRooms(false);
        }
      }
    })();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ===========================================================
           1) HERO SECTION - Dark Theme
         =========================================================== */}
      <section className="relative pt-20 pb-16 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900/50 to-purple-900/20"></div>
        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">
            {/* Left: Hero Text */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Discover your ideal{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    roommate
                  </span>
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0">
                  Lorem ipsum dolor, sque odisc, Porra raver es mesome menresea tu colmet. Enim
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/discover"
                  className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl hover:shadow-blue-500/40 hover:-translate-y-2 overflow-hidden"
                  prefetch={true}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 text-2xl text-white">🔍</span>
                  <span className="relative z-10 font-semibold tracking-wide text-white">Search</span>
                  <div className="absolute inset-0 -top-40 bg-gradient-to-b from-white/20 to-transparent w-full h-full transform rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Link>
                <Link
                  href="/auth/signup"
                  className="group relative inline-flex items-center gap-3 px-10 py-4 bg-slate-800/60 border-2 border-slate-600/50 text-white rounded-2xl text-lg font-semibold hover:bg-slate-700/70 hover:border-blue-400/60 transition-all duration-300 backdrop-blur-md hover:-translate-y-1 shadow-lg hover:shadow-slate-900/30"
                  prefetch={true}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">✨</span>
                  <span className="font-semibold tracking-wide">Sign Up</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>

            {/* Right: Hero Image with room cards overlay */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent rounded-2xl"></div>
              </div>
              
              {/* Floating room cards */}
              <div className="absolute -bottom-6 -left-4 lg:-left-8 w-48 h-32 bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-600/50 shadow-xl">
                <div className="text-white">
                  <div className="text-sm text-slate-300">Enome, MA</div>
                  <div className="text-xl font-bold text-blue-400">$600/month</div>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-4 lg:-right-8 w-48 h-32 bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-slate-600/50 shadow-xl">
                <div className="text-white">
                  <div className="text-sm text-slate-300">Bnsoe, MA</div>
                  <div className="text-xl font-bold text-blue-400">$850/month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
           2) FEATURES SECTION - Dark Theme Cards
         =========================================================== */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose ShareSpace?
            </h2>
            <p className="mx-auto max-w-2xl text-slate-300 text-lg">
              We simplify your search. Verified listings, secure in-app chat, and
              an interactive map help you find a roommate or room that fits your
              lifestyle.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="dark-card p-8 text-center group hover:scale-105 transition-all duration-500">
              <Users className="w-12 h-12 text-blue-400 mb-6 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Personalized Matches
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Complete a quick profile survey—get paired with roommates who
                share your habits and interests.
              </p>
            </div>

            <div className="dark-card p-8 text-center group hover:scale-105 transition-all duration-500">
              <Home className="w-12 h-12 text-blue-400 mb-6 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Verified Listings
              </h3>
              <p className="text-slate-300 leading-relaxed">
                All rooms are vetted by our team. You see honest photos and
                accurate rent details—no surprises.
              </p>
            </div>

            <div className="dark-card p-8 text-center group hover:scale-105 transition-all duration-500">
              <MapPin className="w-12 h-12 text-blue-400 mb-6 mx-auto" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Interactive Map Search
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Explore neighborhoods visually—zoom, pan, and view the area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
           3) FEATURED LISTINGS (last 3 rooms) - DARK THEME
         =========================================================== */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
            <h2 className="text-3xl font-bold text-white mb-4">
              Featured Rooms
            </h2>
            <p className="text-slate-300 mx-auto max-w-2xl">
              Here are the three most recent rooms uploaded to Sharespace.
            </p>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="dark-card overflow-hidden animate-pulse"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationDuration: '1.5s'
                  }}
                >
                  <div className="w-full h-48 bg-slate-700"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-5 bg-slate-700 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-700 rounded w-full"></div>
                    <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
              <div className="text-slate-500 text-8xl mb-6">🏠</div>
              <h3 className="text-xl font-semibold text-white mb-2">No rooms available yet</h3>
              <p className="text-slate-400">Check back soon for new listings!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((room, index) => (
                <div
                  key={room.id}
                  className="group dark-card overflow-hidden
                           opacity-0 animate-[slideUp_0.6s_ease-out_forwards]
                           will-change-transform"
                  style={{
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  <div className="relative w-full h-48 overflow-hidden bg-slate-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-700 animate-pulse"></div>
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
                      className="object-cover transition-all duration-700 ease-out 
                               group-hover:scale-110 opacity-0"
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.opacity = '1';
                        // Remove loading placeholder
                        const placeholder = target.previousElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.opacity = '0';
                          setTimeout(() => placeholder.remove(), 300);
                        }
                      }}
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-white 
                                   group-hover:text-blue-400 transition-colors duration-300 
                                   line-clamp-2 leading-tight">
                        {room.title || 'Untitled Room'}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-400 font-bold text-lg">
                          {typeof room.price === 'number'
                            ? `$${room.price.toLocaleString()}/mo`
                            : 'Contact for price'}
                        </p>
                        {room.address && (
                          <span className="text-xs text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full
                                         border border-slate-600 transition-colors duration-200
                                         group-hover:bg-blue-500/20 group-hover:border-blue-400/50 group-hover:text-blue-300">
                            📍 {room.address.split(',')[0]?.trim()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {room.description || 'No description available.'}
                    </p>
                    
                    <div className="pt-3 border-t border-slate-600">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1">
                          ⏰ {room.createdAt?.toDate ? 
                            new Date(room.createdAt.toDate()).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'Recently added'
                          }
                        </span>
                        <Link 
                          href={`/discover/rooms`}
                          className="group/link relative inline-flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-blue-400/50 text-blue-400 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-blue-400 hover:text-white hover:border-blue-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-400/25 overflow-hidden"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300"></span>
                          <span className="relative z-10 text-blue-400 group-hover/link:text-white transition-colors duration-300">View Details</span>
                          <span className="relative z-10 text-blue-400 group-hover/link:text-white transition-all duration-200 group-hover/link:translate-x-1">→</span>
                          <div className="absolute inset-0 -top-40 bg-gradient-to-b from-white/20 to-transparent w-full h-full transform rotate-12 translate-x-[-100%] group-hover/link:translate-x-[100%] transition-transform duration-500"></div>
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
           4) ABOUT SECTION – Dark Theme
         =========================================================== */}
      <section className="py-16 px-6 lg:px-8 bg-slate-800/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-24">
          {/* Left: Illustrative graphic */}
          <div className="relative w-full max-w-md flex-shrink-0 h-80">
            <Image
              src="/ROOMIES.jpg"
              alt="People sharing a living space"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-xl shadow-2xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={80}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent rounded-xl"></div>
          </div>

          {/* Right: Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-6">
              About ShareSpace
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl text-lg leading-relaxed">
              ShareSpace is the easiest way to find a roommate or room near
              you. Whether you're a student, a young professional, or just want
              to split rent, our smart matching engine pairs you with
              compatible roommates and verified rooms—no hassles, no scams.
            </p>
            <ul className="space-y-4 text-slate-300 mb-8 max-w-2xl">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Smart Matching:</strong> Fill out a quick profile
                  survey—share your daily habits and interests. Get matched with
                  someone who actually fits your lifestyle.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Verified Listings:</strong> Every room is vetted by
                  our team. You see accurate photos, honest descriptions, and no
                  hidden fees.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Built‐In Chat:</strong> Message potential roommates
                  and landlords directly in-app—ask questions, schedule tours,
                  finalize details without switching apps.
                </div>
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-lg font-bold transition-all duration-300 shadow-xl hover:shadow-blue-500/40 hover:-translate-y-2 overflow-hidden"
              prefetch={true}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Sparkles className="w-6 h-6 relative z-10 text-white group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
              <span className="relative z-10 font-semibold tracking-wide text-white">Sign Up Now</span>
              <div className="absolute inset-0 -top-40 bg-gradient-to-b from-white/20 to-transparent w-full h-full transform rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================================
           5) LAZY LOADED MAP SECTION
         =========================================================== */}
      <LazyMapSection />

      {/* ===========================================================
           6) FOOTER - Dark Theme
         =========================================================== */}
      <footer className="mt-auto bg-slate-900 py-12 text-white border-t border-slate-700">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to find your perfect roommate?
          </h3>
          <p className="text-lg mb-8 text-slate-300">
            Join thousands of happy ShareSpace users—create a free account and
            start searching in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-xl font-bold transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-3 overflow-hidden"
            prefetch={true}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <Sparkles className="w-7 h-7 relative z-10 text-white group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
            <span className="relative z-10 font-bold tracking-wide text-white">Sign Up Now</span>
            <div className="absolute inset-0 -top-40 bg-gradient-to-b from-white/20 to-transparent w-full h-full transform rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </Link>

          <div className="mt-12 border-t border-slate-700 pt-8 text-sm flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
            <p className="text-slate-400">© {new Date().getFullYear()} ShareSpace. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link href="/terms" className="text-slate-400 hover:text-blue-400 transition-colors duration-200 hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors duration-200 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
