'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-6 left-6"
      >
        <Image
          src="/logo.png"
          alt="Homigo Logo"
          width={120}
          height={40}
        />
      </motion.div>

      {/* Animated Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl z-10"
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          Welcome to Homigo
        </h1>


        <p className="mt-8 text-3xl text-purple-300 italic">
          Scroll, pick, move in quick
        </p>
        <p className="mt-4 text-lg text-gray-300">
        From campus connections to cozy corners — Homigo helps you feel at home, wherever you go.
        </p>
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8"
        >
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-lg font-semibold text-white hover:scale-105 transition-transform shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Explore Now
          </Link>
        </motion.div>
      </motion.div>

      {/* Decorative Animated Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2, delay: 1 }}
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#7c3aed33] via-transparent to-transparent pointer-events-none"
      />
    </main>
  )
}
