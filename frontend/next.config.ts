import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
    experimental: {
        createMessagesDeclaration: ["./messages/id.json", "./messages/en.json"],
    },
});

export default withNextIntl({
    reactCompiler: true,
    transpilePackages: ["@psb/shared"],
    experimental: {
        optimizePackageImports: ["@psb/shared", "@chakra-ui/react"],
    },
} satisfies NextConfig);
