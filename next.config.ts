import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        port: "",
        pathname: "/**"
      }
    ]
  },
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["lucide-react"] }
};

export default nextConfig;
