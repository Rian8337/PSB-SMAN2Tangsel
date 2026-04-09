import {
    IAuthService,
    IClassService,
    IConfigService,
    INotificationService,
    IScheduleService,
    ISessionService,
    ISubjectService,
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
 * Mock implementation of {@link IClassService}.
 */
export const mockClassService: Mocked<IClassService> = {
    getClassById: vi.fn(),
    listClasses: vi.fn(),
    createClass: vi.fn(),
    updateClass: vi.fn(),
    deleteClass: vi.fn(),
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
    getSession: vi.fn(),
    listSessions: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
};

/**
 * Mock implementation of {@link ISubjectService}.
 */
export const mockSubjectService: Mocked<ISubjectService> = {
    findById: vi.fn(),
    findByCode: vi.fn(),
    listSubjects: vi.fn(),
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
};

/**
 * Mock implementation of {@link IUserService}.
 */
export const mockUserService: Mocked<IUserService> = {
    findById: vi.fn(),
    listUsers: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
    delete: vi.fn(),
};
