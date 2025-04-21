/* app/components/Hero.tsx */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-white via-purple-100 to-pink-50 text-gray-900 flex flex-col items-center justify-center px-4 py-24 text-center">
      {/* Logo */}
      <Image
        src="/logo.svg"
        alt="Homigo Logo"
        width={64}
        height={64}
        className="mb-6 drop-shadow-md"
      />

      {/* Animated Headline */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
      >
        Scroll, pick, move in quick.
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="text-lg md:text-xl text-gray-700 max-w-2xl mt-6"
      >
        Homigo helps you find roommates and rooms that match your vibe. No drama, just good living.
      </motion.p>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-10"
      >
        <Link
          href="/discover"
          className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          Start Exploring
        </Link>
      </motion.div>
    </section>
  )
}
