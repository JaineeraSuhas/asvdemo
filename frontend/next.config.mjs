/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: {
    appIsrStatus: false,
  },
  experimental: {
    allowedDevOrigins: ['192.168.29.46', 'localhost', '127.0.0.1']
  }
}

export default nextConfig
