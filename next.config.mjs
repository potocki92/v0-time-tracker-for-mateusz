/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid webpack PackFileCacheStrategy serialization warnings for large strings
      // by using in-memory cache during local development.
      config.cache = {
        type: 'memory',
      }
    }

    return config
  },
}

export default nextConfig
