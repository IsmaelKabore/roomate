'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col overflow-hidden">

      {/* Top Banner Image */}
      <div className="relative w-full h-[520px]">
        <Image
          src="/roomates.png" // <-- Replace with your actual roommate/friends image
          alt="Friends hanging out"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Text Section */}
      <section className="flex flex-col justify-center items-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-400 text-transparent bg-clip-text">
            Welcome to Eazy
          </h1>

          <p className="mt-8 text-3xl text-blue-600 italic">
            Scroll, pick, move in quick
          </p>

          <p className="mt-4 text-lg text-gray-600">
            From campus connections to cozy corners — Eazy helps you feel at home, wherever you go.
          </p>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8"
          >
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-full text-lg font-semibold text-white transition-transform hover:scale-105 shadow-md"
            >
              <Sparkles className="w-5 h-5 text-white" />
              Explore Now
            </Link>
          </motion.div>
        </motion.div>
      </section>

    </main>
  )
}
