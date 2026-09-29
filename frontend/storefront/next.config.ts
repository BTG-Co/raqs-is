import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_AUTH_MODE === "mock") {
  throw new Error(
    "Refusing to build with NEXT_PUBLIC_AUTH_MODE=mock. Swap MockAuthProvider for POST /auth/login before a production build.",
  );
}

const nextConfig: NextConfig = {
  transpilePackages: ["@raqs/shared"],
};

export default nextConfig;
