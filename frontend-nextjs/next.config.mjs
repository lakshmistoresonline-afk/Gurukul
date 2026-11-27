/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  reactStrictMode: true,
  swcMinify: false,
};

export default nextConfig;
