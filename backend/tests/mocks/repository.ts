import {
    IAdministratorRepository,
    IAssignmentRepository,
    IAttachmentRepository,
    IClassRepository,
    IClassStudentRepository,
    IClassSubjectRepository,
    IFileRepository,
    IMaterialRepository,
    INotificationRepository,
    IScheduleRepository,
    ISessionRepository,
    IStudentRepository,
    ISubmissionRepository,
    ISubjectRepository,
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
    getById: vi.fn(),
    getEnrolledStudentIds: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    hasSubjects: vi.fn(),
    hasStudents: vi.fn(),
    delete: vi.fn(),
};

/**
 * Mock implementation of {@link IClassStudentRepository}.
 */
export const mockClassStudentRepository: Mocked<IClassStudentRepository> = {
    getEnrolledStudents: vi.fn(),
    getUnenrolledStudents: vi.fn(),
    findActiveEnrollment: vi.fn(),
    enrollStudent: vi.fn(),
    unenrollStudent: vi.fn(),
};

/**
 * Mock implementation of {@link IClassSubjectRepository}.
 */
export const mockClassSubjectRepository: Mocked<IClassSubjectRepository> = {
    listAssignedSubjects: vi.fn(),
    listAssignedSubjectsForTeacher: vi.fn(),
    listUnassignedSubjects: vi.fn(),
    assignSubject: vi.fn(),
    updateAssignedSubject: vi.fn(),
    hasAssociatedContent: vi.fn(),
    unassignSubject: vi.fn(),
    getStudentDashboard: vi.fn(),
    getTeacherDashboard: vi.fn(),
    getTeacherClassSubject: vi.fn(),
};

/**
 * Mock implementation of {@link INotificationRepository}.
 */
export const mockNotificationRepository: Mocked<INotificationRepository> = {
    create: vi.fn(),
    createBulk: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    getUnreadCount: vi.fn(),
    updateReadStatus: vi.fn(),
};

/**
 * Mock implementation of {@link IScheduleRepository}.
 */
export const mockScheduleRepository: Mocked<IScheduleRepository> = {
    findById: vi.fn(),
    findByClassId: vi.fn(),
    findByTeacherId: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    hasConflict: vi.fn(),
};

/**
 * Mock implementation of {@link ISessionRepository}.
 */
export const mockSessionRepository: Mocked<ISessionRepository> = {
    getActive: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

/**
 * Mock implementation of {@link ISubjectRepository}.
 */
export const mockSubjectRepository: Mocked<ISubjectRepository> = {
    getById: vi.fn(),
    getByCode: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    hasClasses: vi.fn(),
    delete: vi.fn(),
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

/**
 * Mock implementation of {@link IFileRepository}.
 */
export const mockFileRepository: Mocked<IFileRepository> = {
    read: vi.fn(),
    saveFile: vi.fn(),
    rename: vi.fn(),
    deleteFile: vi.fn(),
};

/**
 * Mock implementation of {@link ISubmissionRepository}.
 */
export const mockSubmissionRepository: Mocked<ISubmissionRepository> = {
    getForAssignment: vi.fn(),
    getForAssignmentWithAttachments: vi.fn(),
    getByStudent: vi.fn(),
    getAttachmentIds: vi.fn(),
    add: vi.fn(),
    addAttachments: vi.fn(),
    delete: vi.fn(),
};

/**
 * Mock implementation of {@link IAssignmentRepository}.
 */
export const mockAssignmentRepository: Mocked<IAssignmentRepository> = {
    getStudentAssignment: vi.fn(),
    getTeacherAssignment: vi.fn(),
    getStudentAttachment: vi.fn(),
    getTeacherAttachment: vi.fn(),
    addAssignment: vi.fn(),
    updateAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    getAssignmentAttachmentIds: vi.fn(),
    getSubmissionAttachmentIds: vi.fn(),
};

/**
 * Mock implementation of {@link IMaterialRepository}.
 */
export const mockMaterialRepository: Mocked<IMaterialRepository> = {
    getStudentMaterial: vi.fn(),
    getTeacherMaterial: vi.fn(),
    getStudentAttachment: vi.fn(),
    getTeacherAttachment: vi.fn(),
    addMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
    getMaterialAttachmentIds: vi.fn(),
};

/**
 * Mock implementation of {@link IAttachmentRepository}.
 */
export const mockAttachmentRepository: Mocked<IAttachmentRepository> = {
    create: vi.fn(),
    getByIds: vi.fn(),
    updateNameAndPath: vi.fn(),
    deleteByIds: vi.fn(),
};
