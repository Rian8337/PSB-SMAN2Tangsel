import { Mocked } from "vitest";

/**
 * Mock implementation of navigation's `useRouter`.
 */
export const mockRouter: Mocked<
    ReturnType<typeof import("@/i18n/navigation").useRouter>
> = {
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
export const mockNavigation: Mocked<
    Partial<typeof import("@/i18n/navigation")>
> = {
    usePathname: vi.fn(() => "/"),
    useRouter: vi.fn(() => mockRouter),
};

/**
 * Partial mock implementation of `next-intl`.
 */
export const mockNextIntl = {
    useLocale: vi.fn(() => "id"),
    useTranslations: vi.fn(() => (key: string) => key),
} satisfies Mocked<Partial<Record<keyof typeof import("next-intl"), unknown>>>;
