/** @type {import('next').NextConfig} */
const backendUrl = process.env.NEXT_BACKEND_URL;

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: {
    serverActions: {},
  },
  async rewrites() {
    const destination = (backendUrl || "http://localhost:8001").replace(/\/$/, "");
    const isAbsolute = /^https?:\/\//i.test(destination);

    if (!isAbsolute) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${destination}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
