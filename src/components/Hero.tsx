/* app/components/Hero.tsx */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center px-4 py-24 text-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900/50 to-purple-900/20"></div>
      
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <Image
          src="/logo_sharespace.png"
          alt="ShareSpace Logo"
          width={80}
          height={80}
          className="mb-8 drop-shadow-2xl rounded-2xl"
        />
      </motion.div>

      {/* Animated Headline */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-5xl md:text-7xl font-bold mb-6 relative z-10"
      >
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Scroll, pick, move in quick.
        </span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="text-xl md:text-2xl text-slate-300 max-w-3xl mt-6 relative z-10 leading-relaxed"
      >
        ShareSpace helps you find roommates and rooms that match your vibe. No drama, just good living.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 flex flex-col sm:flex-row gap-4 relative z-10"
      >
        <Link
          href="/discover"
          className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-lg font-bold text-white transition-all duration-300 shadow-xl hover:shadow-blue-500/40 hover:-translate-y-2 overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative z-10 text-2xl">✨</span>
          <span className="relative z-10 font-semibold tracking-wide">Start Exploring</span>
          <div className="absolute inset-0 -top-40 bg-gradient-to-b from-white/20 to-transparent w-full h-full transform rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </Link>
        
        <Link
          href="/auth/signup"
          className="group relative inline-flex items-center gap-3 px-10 py-4 bg-slate-800/60 border-2 border-slate-600/50 text-white rounded-2xl text-lg font-semibold hover:bg-slate-700/70 hover:border-blue-400/60 transition-all duration-300 backdrop-blur-md hover:-translate-y-1 shadow-lg hover:shadow-slate-900/30"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🚀</span>
          <span className="font-semibold tracking-wide">Sign Up Free</span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </motion.div>

      {/* Floating elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
    </section>
  )
}
