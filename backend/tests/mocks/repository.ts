import {
    IAdministratorRepository,
    IClassRepository,
    INotificationRepository,
    IScheduleRepository,
    ISessionRepository,
    IStudentRepository,
    ITeacherRepository,
    IUserRepository,
} from "@/repositories";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link IAdministratorRepository}.
 */
export const mockAdministratorRepository: Mocked<IAdministratorRepository> = {
    findByStaffId: vi.fn(),
    getLoginData: vi.fn(),
};

/**
 * Mock implementation of {@link IClassRepository}.
 */
export const mockClassRepository: Mocked<IClassRepository> = {
    getEnrolledStudentIds: vi.fn(),
};

/**
 * Mock implementation of {@link INotificationRepository}.
 */
export const mockNotificationRepository: Mocked<INotificationRepository> = {
    create: vi.fn(),
    createBulk: vi.fn(),
    findByUserId: vi.fn(),
    getUnreadCount: vi.fn(),
    updateReadStatus: vi.fn(),
};

/**
 * Mock implementation of {@link IScheduleRepository}.
 */
export const mockScheduleRepository: Mocked<IScheduleRepository> = {
    findByClassId: vi.fn(),
    findByTeacherId: vi.fn(() => Promise.resolve([])),
};

/**
 * Mock implementation of {@link ISessionRepository}.
 */
export const mockSessionRepository: Mocked<ISessionRepository> = {
    getActive: vi.fn(),
};

/**
 * Mock implementation of {@link IStudentRepository}.
 */
export const mockStudentRepository: Mocked<IStudentRepository> = {
    findByNISN: vi.fn(),
    getLoginData: vi.fn(),
};

/**
 * Mock implementation of {@link ITeacherRepository}.
 */
export const mockTeacherRepository: Mocked<ITeacherRepository> = {
    findByStaffId: vi.fn(),
    getLoginData: vi.fn(),
};

/**
 * Mock implementation of {@link IUserRepository}.
 */
export const mockUserRepository: Mocked<IUserRepository> = {
    findById: vi.fn(),
    listUsers: vi.fn(),
    create: vi.fn(),
    updateActiveState: vi.fn(),
    updatePassword: vi.fn(),
    delete: vi.fn(),
};
