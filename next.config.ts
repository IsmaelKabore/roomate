// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me'
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com'
      }
    ]
  },
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors. You should fix these errors
    // during development, but they shouldn't block deploys.
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig
