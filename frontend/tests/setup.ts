import "@testing-library/jest-dom";
import { createElement, PropsWithChildren } from "react";

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
