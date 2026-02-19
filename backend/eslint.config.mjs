// @ts-check

import eslint from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
    eslint.configs.recommended,
    {
        files: ["**/*.ts"],
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
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
    { ignores: ["dist/**", "node_modules/**", "test.js"] },
    {
        files: ["tests/**"],
        plugins: { vitest },
        rules: vitest.configs.recommended.rules,
    },
    {
        files: [
            "ecosystem.config.js",
            "eslint.config.mjs",
            "prettier.config.mjs",
        ],
        ...tseslint.configs.disableTypeChecked,
    },
);
