import {
    IAuthAPIClient,
    INotificationAPIClient,
    IScheduleAPIClient,
    ISessionAPIClient,
    ISubjectAPIClient,
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
 * Mock implementation of {@link ISessionAPIClient}.
 */
export const mockSessionApiClient: Mocked<ISessionAPIClient> = {
    getActive: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    listSessions: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
};

/**
 * Mock implementation of {@link ISubjectAPIClient}.
 */
export const mockSubjectApiClient: Mocked<ISubjectAPIClient> = {
    getSubject: vi.fn(),
    listSubjects: vi.fn(),
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
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
