/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image domains for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Suppress Prisma edge-runtime warning in Next.js
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdf-lib'],
}

module.exports = nextConfig
