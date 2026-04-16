/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {},
  images: {
    remotePatterns: [{
      protocol: 'https', hostname: '*.<supabase.co>'
    }]
  },
  eslint: {
    dirs: ['app','components','lib','hooks','services']
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
  webpack: (config, { dev }) => {
    if (dev) config.cache = { type: 'memory' }
    return config
  },
}

export default nextConfig
