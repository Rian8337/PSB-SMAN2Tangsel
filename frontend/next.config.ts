import type { NextConfig } from "next";

export default {
    reactCompiler: true,
    transpilePackages: ["@psb/shared"],
} as NextConfig;
