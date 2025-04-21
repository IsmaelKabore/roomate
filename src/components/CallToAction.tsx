'use client'

import Link from 'next/link'

interface Props {
  isLoggedIn: boolean
}

export default function CallToAction({ isLoggedIn }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-24 text-center">
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 bg-opacity-50 backdrop-blur-xl 
                   border border-purple-200 rounded-2xl p-12 shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          {isLoggedIn ? 'Explore all features now.' : 'Ready to join EAZY?'}
        </h2>
        <Link
          href={isLoggedIn ? '/profile' : '/login'}
          className="inline-flex items-center px-8 py-4 bg-purple-500 text-white rounded-full 
                   font-semibold hover:bg-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          {isLoggedIn ? 'Go to Your Profile' : 'Sign In / Create Profile'}
        </Link>
      </div>
    </section>
  )
}
