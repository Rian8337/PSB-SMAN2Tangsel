// @ts-check

import eslint from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
    globalIgnores([
        "**/dist/**",
        "**/node_modules/**",
        "**/test.js",
        "backend/html/**",
        "frontend/html/**",
        "frontend/playwright-report/**",
        "frontend/.next/**",
        "frontend/out/**",
        "frontend/build/**",
        "frontend/next-env.d.ts",
    ]),
    eslint.configs.recommended,
    {
        files: ["backend/**/*.ts"],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                // @ts-ignore
                tsconfigRootDir: `${import.meta.dirname}/backend`,
            },
        },
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
    {
        files: [
            "frontend/**/*.ts",
            "frontend/**/*.tsx",
            "packages/shared/**/*.ts",
        ],
        extends: [
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                // @ts-ignore
                tsconfigRootDir: `${import.meta.dirname}/frontend`,
            },
        },
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
    ...nextVitals.map((config) => ({
        ...config,
        files: ["frontend/**/*.{ts,tsx}"],
        ignores: ["frontend/tests/**/*.{ts,tsx}"],
        settings: {
            ...config.settings,
            next: {
                rootDir: "./frontend",
            },
        },
    })),
    ...nextTs.map((config) => ({
        ...config,
        files: ["frontend/**/*.{ts,tsx}"],
        ignores: ["frontend/tests/**/*.{ts,tsx}"],
        settings: {
            ...config.settings,
            next: {
                rootDir: "./frontend",
            },
        },
    })),
    {
        files: ["**/tests/**"],
        plugins: { vitest },
        rules: {
            ...vitest.configs.recommended.rules,
            "@typescript-eslint/unbound-method": "off",
        },
    },
    {
        files: ["eslint.config.mjs", "prettier.config.mjs"],
        ...tseslint.configs.disableTypeChecked,
    },
);
