import "@testing-library/jest-dom";
import { createElement, PropsWithChildren } from "react";

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        // Match Chakra UI's desktop-sized breakpoints.
        matches: query.includes("min-width") || query.includes("md"),
        media: query,
        onchange: null,
        addListener: () => {
            /* empty */
        },
        removeListener: () => {
            /* empty */
        },
        addEventListener: () => {
            /* empty */
        },
        removeEventListener: () => {
            /* empty */
        },
        dispatchEvent: () => false,
    }),
});

class ResizeObserverMock implements ResizeObserver {
    disconnect() {
        // Mock
    }
    observe() {
        // Mock
    }
    unobserve() {
        // Mock
    }
}

global.ResizeObserver = ResizeObserverMock;

vi.mock("@/i18n/navigation", async () => {
    const { mockNavigation } = await import("./mocks");

    return {
        ...mockNavigation,

        // Provide a dummy Link component so tests using <Link> don't break
        Link: ({
            children,
            href,
            ...props
        }: PropsWithChildren<{ href: string }>) =>
            createElement("a", { href, ...props }, children),
    } satisfies Partial<
        Record<keyof typeof import("@/i18n/navigation"), unknown>
    >;
});

vi.mock("next-intl", async (importOriginal) => {
    const original = await importOriginal<typeof import("next-intl")>();
    const { mockNextIntl } = await import("./mocks");

    return { ...original, ...mockNextIntl };
});

vi.mock("@/components/ui/toaster", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("@/components/ui/toaster")>();

    const { mockToaster } = await import("./mocks");

    return { ...original, toaster: mockToaster };
});
