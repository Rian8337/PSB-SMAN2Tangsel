import {
    IAdministratorRepository,
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
};
