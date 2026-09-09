import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      // Compat: la Ruta Aprendiz heredada vive ahora en Academia.
      { source: "/app/learn", destination: "/app/academia", permanent: true },
    ];
  },
};

export default nextConfig;
