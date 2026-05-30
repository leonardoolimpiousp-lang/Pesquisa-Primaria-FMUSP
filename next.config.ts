import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do projeto: o caminho ancestral tem outros lockfiles e o Next
  // poderia inferir uma raiz de workspace errada.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
