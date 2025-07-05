// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Sparkles, Home, Users, MapPin,ShieldCheck, MessageCircle } from 'lucide-react';
import { getFeaturedRoomPosts, RoomPost } from '@/lib/firestorePosts';
import { CircularProgress } from '@mui/material';
import { motion, Variants } from 'framer-motion';
import TypewriterEffect from '@/components/TypewriterEffect';
import AccuracyCounter from '@/components/AccuracyCounter';




// Lazy load the map component since it's at the bottom of the page
const LazyMapSection = dynamic(() => import('./components/MapSection'), {
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-white">
      <CircularProgress sx={{ color: '#007AFF' }} />
    </div>
  ),
  ssr: false,
});

// Variants
const sectionVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.4 } },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function HomePage() {
  const [featured, setFeatured] = useState<RoomPost[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [heroDone, setHeroDone] = useState(false);
  const [showAccuracy, setShowAccuracy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const rooms = await getFeaturedRoomPosts(3);
        if (!isMounted) return;
        setFeatured(rooms);
      } catch {
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
      {/* 1) HERO SECTION */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative pt-20 pb-16 px-6 lg:px-8 overflow-hidden"
      >
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-7xl grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center"
        >
          {/* Left */}
          <div className="text-center lg:text-left space-y-8">
            <motion.h1
              variants={heroItem}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
            >
              Discover your ideal{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                roommate
              </span>
            </motion.h1>
            <motion.div variants={heroItem} className="text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
              <TypewriterEffect
                text=" Get matched to your perfect roommate with AI."
                speed={50}
                onComplete={() => setHeroDone(true)}
              />
            </motion.div>
            <motion.div variants={heroItem} className="flex flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/discover"
                className="
                  group relative inline-flex
                  items-center gap-3
                  px-6 sm:px-10 py-4
                  bg-gradient-to-r from-blue-500 to-blue-600
                  text-white
                  rounded-2xl
                  text-base sm:text-lg font-bold
                  transition-all duration-300
                  shadow-xl hover:shadow-blue-500/40 hover:-translate-y-2
                  overflow-hidden
                "
                prefetch={true}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-semibold tracking-wide text-white">
                  Get Started
                </span>
                <div
                  className="
                    absolute inset-0 -top-40
                    bg-gradient-to-b from-white/20 to-transparent
                    w-full h-full
                    transform rotate-12 translate-x-[-100%]
                    group-hover:translate-x-[100%]
                    transition-transform duration-700
                  "
                />
              </Link>
            </motion.div>
          </div>
          {/* Right */}
          <motion.div variants={heroItem} className="relative">
            <motion.div variants={heroItem} className="relative w-full max-w-md mx-auto h-96 lg:h-[500px]">
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
            </motion.div>
            <motion.div
              variants={heroItem}
              className="absolute -bottom-6 -left-4 lg:-left-8 w-48 h-32 bg-white rounded-2xl p-4 border border-gray-200 shadow-lg"
            >
              <div className="text-gray-900">
                <div className="text-sm text-gray-600">Berkeley, CA</div>
                <div className="text-xl font-bold text-blue-400">$600/month</div>
              </div>
            </motion.div>
            <motion.div
              variants={heroItem}
              className="absolute -top-6 -right-4 lg:-right-8 w-48 h-32 bg-white rounded-2xl p-4 border border-gray-200 shadow-lg"
            >
              <div className="text-gray-900">
                <div className="text-sm text-gray-600">Oakland, CA</div>
                <div className="text-xl font-bold text-blue-400">$850/month</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* 2) IDEAL ROOMMATE SECTION */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        animate={heroDone ? 'visible' : 'hidden'}
        className="py-16 px-6 lg:px-8 bg-gray-50"
      >
        <motion.div variants={sectionVariant} className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div variants={sectionVariant} className="text-center lg:text-left space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Looking for a specific roommate?</h2>
            <p className="text-lg text-gray-600">
              Tell us what you’re looking for and our AI will do the rest.
            </p>
          </motion.div>
          <motion.div variants={sectionVariant} className="flex justify-center lg:justify-end">
            <div
              className="
                w-full max-w-xl
                bg-white
                border border-gray-300
                rounded-xl
                p-4
                shadow-sm
                text-gray-700
                font-mono
                text-base
              "
            >
              <TypewriterEffect
                text=" I am looking for a roommate who loves board games, early morning workouts, quiet study nights, and weekend hikes. Also, someone who values a calm and supportive home environment."
                speed={60}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* 3) FEATURED LISTINGS */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-16 px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Rooms</h2>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow animate-pulse">
                  <div className="w-full h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-500 text-8xl mb-6">🏠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms available yet</h3>
              <p className="text-gray-600">Check back soon for new listings!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((room) => (
                <div key={room.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg">
                  <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={room.images?.[0] ?? 'https://via.placeholder.com/400x240?text=No+Image'}
                      alt={room.title || 'Room Image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={75}
                      className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
                      priority={false}
                    />
                  </div>
                  <div className="p-6 space-y-4">
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
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                          📍 {room.address.split(',')[0]?.trim()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {room.description || 'No description available.'}
                    </p>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          ⏰{' '}
                          {room.createdAt?.toDate
                            ? new Date(room.createdAt.toDate()).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recently added'}
                        </span>
                        <Link
                          href="/discover/rooms"
                          className="relative inline-flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-black-400/50 text-black-400 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-black-400 hover:text-white hover:border-black-400 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-400/25"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

     {/* 4) FEATURES SECTION */}
<motion.section
  variants={sectionVariant}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
  className="py-16 px-6 lg:px-8 bg-white"
>
  <div className="mx-auto max-w-7xl">
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {[
        {
          icon: Users,
          title: 'Personalized Matches',
          text: 'Complete a short profile and discover roommates who share your lifestyle and habits.',
        },
        {
          icon: ShieldCheck,
          title: 'Verified Listings',
          text: 'Each room is vetted by our team, accurate photos, clear rent details, zero surprises.',
        },
        {
          icon: MessageCircle,
          title: 'Built In Chat',
          text: 'Connect directly with roommates and landlords ask questions, schedule tours, finalize details.',
        },
      ].map(({ icon: Icon, title, text }, idx) => (
        <motion.div
          key={idx}
          variants={sectionVariant}
          className="bg-white rounded-2xl p-8 text-center border border-black hover:shadow-lg transition-shadow duration-300"
        >
          <div className="bg-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
          <p className="text-gray-700 text-base leading-relaxed">{text}</p>
        </motion.div>
      ))}
    </div>
  </div>
</motion.section>



      {/* 5) ABOUT SECTION */}
      <motion.section
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        onViewportEnter={() => setShowAccuracy(true)}
        viewport={{ once: true, amount: 0.3 }}
        className="py-16 px-6 lg:px-8 bg-white"
      >
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-12 lg:flex-row lg:gap-24">
          <motion.div
            variants={sectionVariant}
            className="w-full max-w-md h-80 relative flex-shrink-0 bg-gray-50 rounded-xl shadow-lg overflow-hidden"
          >
            <Image
              src="/ROOMIES.jpg"
              alt="People sharing a living space"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={80}
            />
          </motion.div>
          <motion.div
            variants={sectionVariant}
            className="w-full bg-gray-50 rounded-xl shadow-lg p-8"
          >
            <h2 className="text-3xl font-bold center text-gray-900 mb-6">ShareSpace AI </h2>
            <p className="text-gray-600 mb-8 max-w-2xl text-lg leading-relaxed">
              {/* Your about text here */}
            </p>
            {showAccuracy && <AccuracyCounter target={98} duration={2000} />}
          </motion.div>
        </div>
      </motion.section>

      {/* 6) LAZY LOADED MAP SECTION */}
      <LazyMapSection />

      {/* 7) FOOTER */}
      <motion.footer
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-auto bg-white py-12 text-gray-700 border-t border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Ready to find your perfect roommate?</h3>
          <p className="text-lg mb-8 text-gray-600">
            Join thousands of happy ShareSpace users, create a free account and start searching in minutes.
          </p>
          <Link
            href="/auth/signup"
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-xl font-bold transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-3 overflow-hidden"
            prefetch={true}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 font-semibold tracking-wide text-white">Sign Up Now</span>
          </Link>
          <div className="mt-12 border-t border-gray-200 pt-8 text-sm flex flex-col items-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
            <p>© {year} ShareSpace. All rights reserved.</p>
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
      </motion.footer>
    </div>
  );
}
