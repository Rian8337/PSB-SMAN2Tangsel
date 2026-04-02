import {
    IAdministratorRepository,
    IClassRepository,
    INotificationRepository,
    IScheduleRepository,
    ISessionRepository,
    IStudentRepository,
    ITeacherRepository,
    ITransactionManager,
    IUserRepository,
} from "@/repositories";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link ITransactionManager}.
 *
 * By default, calls the provided callback with an empty object.
 */
export const mockTransactionManager: Mocked<ITransactionManager> = {
    execute: vi.fn(
        (callback) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            callback(
                {} as unknown as Parameters<
                    Parameters<ITransactionManager["execute"]>[0]
                >[0],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ) as any,
    ),
};

/**
 * Mock implementation of {@link IAdministratorRepository}.
 */
export const mockAdministratorRepository: Mocked<IAdministratorRepository> = {
    findByStaffId: vi.fn(),
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
    getClassId: vi.fn(() => Promise.resolve(null)),
};

/**
 * Mock implementation of {@link ITeacherRepository}.
 */
export const mockTeacherRepository: Mocked<ITeacherRepository> = {
    findByStaffId: vi.fn(),
};

/**
 * Mock implementation of {@link IUserRepository}.
 */
export const mockUserRepository: Mocked<IUserRepository> = {
    findById: vi.fn(),
    findByIdentifier: vi.fn(),
    listUsers: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
    delete: vi.fn(),
};
