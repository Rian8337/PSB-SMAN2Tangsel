import { IAuthAPIClient, IScheduleAPIClient } from "@/api";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link IAuthAPIClient}.
 */
export const mockAuthApiClient: Mocked<IAuthAPIClient> = {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
};

/**
 * Mock implementation of {@link IScheduleAPIClient}.
 */
export const mockScheduleApiClient: Mocked<IScheduleAPIClient> = {
    download: vi.fn(),
    getSchedule: vi.fn(),
};
