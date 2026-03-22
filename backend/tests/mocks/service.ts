import {
    IAuthService,
    IConfigService,
    INotificationService,
    IScheduleService,
    ISessionService,
    IUserService,
} from "@/services";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link IAuthService}.
 */
export const mockAuthService: Mocked<IAuthService> = {
    clearSession: vi.fn(),
    createSession: vi.fn(),
    login: vi.fn(),
    verifySession: vi.fn(),
    encryptSession: vi.fn(),
    decryptSession: vi.fn(),
};

/**
 * Mock implementation of {@link IConfigService}.
 */
export const mockConfigService: Mocked<IConfigService> = {
    getEnvironmentVariable: vi.fn((key) => {
        // For testing, we want *all* environment variables to be defined.
        const value = process.env[key];

        if (!value) {
            throw new Error(`Environment variable ${key} is not set.`);
        }

        return value;
    }),
};

/**
 * Mock implementation of {@link INotificationService}.
 */
export const mockNotificationService: Mocked<INotificationService> = {
    getUserNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    publishToClass: vi.fn(),
    publishToUser: vi.fn(),
    updateReadStatus: vi.fn(),
};

/**
 * Mock implementation of {@link IScheduleService}.
 */
export const mockScheduleService: Mocked<IScheduleService> = {
    getClassSchedule: vi.fn(),
    getTeacherSchedule: vi.fn(),
    generateIcsFile: vi.fn(),
};

/**
 * Mock implementation of {@link ISessionService}.
 */
export const mockSessionService: Mocked<ISessionService> = {
    getActive: vi.fn(),
};

/**
 * Mock implementation of {@link IUserService}.
 */
export const mockUserService: Mocked<IUserService> = {
    findById: vi.fn(),
    listUsers: vi.fn(),
};
