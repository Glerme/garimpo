import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "pg"],
  poweredByHeader: false,
  // Permite rodar uma segunda cópia (testes) sem brigar com a pasta .next da principal.
  distDir: process.env.GARIMPO_DIST || ".next",
};

export default config;
