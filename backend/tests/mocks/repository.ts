import {
    IAdministratorRepository,
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
};

/**
 * Mock implementation of {@link IStudentRepository}.
 */
export const mockStudentRepository: Mocked<IStudentRepository> = {
    findByNISN: vi.fn(),
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
};
