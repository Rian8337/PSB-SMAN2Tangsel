import {
    IAuthAPIClient,
    INotificationAPIClient,
    IScheduleAPIClient,
    IUserAPIClient,
} from "@/api";
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
 * Mock implementation of {@link INotificationAPIClient}.
 */
export const mockNotificationApiClient: Mocked<INotificationAPIClient> = {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    updateReadStatus: vi.fn(),
};

/**
 * Mock implementation of {@link IScheduleAPIClient}.
 */
export const mockScheduleApiClient: Mocked<IScheduleAPIClient> = {
    download: vi.fn(),
    getSchedule: vi.fn(),
};

/**
 * Mock implementation of {@link IUserAPIClient}.
 */
export const mockUserApiClient: Mocked<IUserAPIClient> = {
    getUser: vi.fn(),
    listUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updatePassword: vi.fn(),
    deleteUser: vi.fn(),
};
