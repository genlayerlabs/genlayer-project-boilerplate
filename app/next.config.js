/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x2146690DCB6b857e375cA51D449e4400570e7c76",
    NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "0x2146690DCB6b857e375cA51D449e4400570e7c76",
    NEXT_PUBLIC_STUDIO_URL: process.env.NEXT_PUBLIC_STUDIO_URL || "https://studio.genlayer.com/api",
    NEXT_PUBLIC_GENLAYER_CHAIN: process.env.NEXT_PUBLIC_GENLAYER_CHAIN || "studionet",
  },
  // Optimized config for production
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    swcMinify: true,
    esmExternals: true,
    serverComponentsExternalPackages: ['genlayer-js'],
  },
  compiler: {
    removeConsole: false, // Keep console logs for debugging
  },
  // Disable static export for better performance in dev
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Optimized webpack config
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui',
            chunks: 'all',
          },
          wagmi: {
            test: /[\\/]node_modules[\\/](wagmi|@rainbow-me|viem)[\\/]/,
            name: 'wagmi',
            chunks: 'all',
          },
        },
      }
    }
    return config
  },
}

module.exports = nextConfig
