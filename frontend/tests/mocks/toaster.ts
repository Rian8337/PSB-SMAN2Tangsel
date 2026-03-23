import type { createToaster } from "@chakra-ui/react";
import { Mocked } from "vitest";

/**
 * Partial mock implementation of the `toaster` instance created by {@link createToaster}.
 */
export const mockToaster = {
    create: vi.fn(),
} satisfies Mocked<Partial<ReturnType<typeof createToaster>>>;
