import { IAuthService, IConfigService, IUserService } from "@/services";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link IAuthService}.
 */
export const mockAuthService: Mocked<IAuthService> = {
    clearSession: vi.fn(),
    createSession: vi.fn(),
    login: vi.fn(),
    verifySession: vi.fn(),
};

/**
 * Mock implementation of {@link IConfigService}.
 */
export const mockConfigService: Mocked<IConfigService> = {
    getEnvironmentVariable: vi.fn(),
};

/**
 * Mock implementation of {@link IUserService}.
 */
export const mockUserService: Mocked<IUserService> = {
    findById: vi.fn(),
};
