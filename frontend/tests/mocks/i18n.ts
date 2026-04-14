import { Mocked } from "vitest";
import type * as navigation from "@/i18n/navigation";
import type * as nextIntl from "next-intl";

/**
 * Mock implementation of navigation's `useRouter`.
 */
export const mockRouter: Mocked<ReturnType<typeof navigation.useRouter>> = {
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
};

/**
 * Partial mock implementation of navigations that are locale-aware.
 */
export const mockNavigation = {
    usePathname: vi.fn(() => "/"),
    useRouter: vi.fn(() => mockRouter),
} satisfies Mocked<Partial<typeof navigation>>;

const identityTranslate = (key: string) => key;

/**
 * Partial mock implementation of `next-intl`.
 */
export const mockNextIntl = {
    useLocale: vi.fn(() => "id"),
    useTranslations: vi.fn(() => identityTranslate),
} satisfies Mocked<Partial<Record<keyof typeof nextIntl, unknown>>>;
