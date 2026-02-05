import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
    ]
  },
}

export default nextConfig
