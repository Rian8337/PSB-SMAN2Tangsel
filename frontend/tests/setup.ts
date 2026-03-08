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

vi.mock("next-intl", async () => {
    const { mockNextIntl } = await import("./mocks");

    return mockNextIntl satisfies Partial<
        Record<keyof typeof import("next-intl"), unknown>
    >;
});
