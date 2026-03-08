import { IAuthAPIClient } from "@/api";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link IAuthAPIClient}.
 */
export const mockAuthApiClient: Mocked<IAuthAPIClient> = {
    login: vi.fn(),
    logout: vi.fn(),
};
