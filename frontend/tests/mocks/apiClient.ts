import {
    IAnalyticsAPIClient,
    IAuthAPIClient,
    IBookmarkAPIClient,
    IClassAPIClient,
    IClassStudentAPIClient,
    IClassSubjectAPIClient,
    INotificationAPIClient,
    IScheduleAPIClient,
    ISessionAPIClient,
    ISubjectAPIClient,
    ISubjectAssignmentAPIClient,
    ISubjectAssignmentSubmissionAPIClient,
    ISubjectDashboardAPIClient,
    ISubjectMaterialAPIClient,
    IUserAPIClient,
} from "@/api";
import { Mocked } from "vitest";

/**
 * Mock implementation of {@link IAnalyticsAPIClient}.
 */
export const mockAnalyticsApiClient: Mocked<IAnalyticsAPIClient> = {
    getDownloadAnalytics: vi.fn(),
    getSubmissionAnalytics: vi.fn(),
};

/**
 * Mock implementation of {@link IAuthAPIClient}.
 *
 * By default, `getMySessions` returns an empty array, indicating that the user has no sessions.
 */
export const mockAuthApiClient: Mocked<IAuthAPIClient> = {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    getMySessions: vi.fn(() => Promise.resolve([])),
};

/**
 * Mock implementation of {@link IBookmarkAPIClient}.
 */
export const mockBookmarkApiClient: Mocked<IBookmarkAPIClient> = {
    getMyBookmarks: vi.fn(),
    getBookmarkedMaterialIds: vi.fn(),
    addBookmark: vi.fn(),
    removeBookmark: vi.fn(),
};

/**
 * Mock implementation of {@link IClassAPIClient}.
 */
export const mockClassApiClient: Mocked<IClassAPIClient> = {
    getClass: vi.fn(),
    getClassSchedule: vi.fn(),
    listClasses: vi.fn(),
    createClass: vi.fn(),
    updateClass: vi.fn(),
    deleteClass: vi.fn(),
};

/**
 * Mock implementation of {@link IClassStudentAPIClient}.
 */
export const mockClassStudentApiClient: Mocked<IClassStudentAPIClient> = {
    getEnrolledStudents: vi.fn(),
    getUnenrolledStudents: vi.fn(),
    enrollStudent: vi.fn(),
    unenrollStudent: vi.fn(),
};

/**
 * Mock implementation of {@link IClassSubjectAPIClient}.
 */
export const mockClassSubjectApiClient: Mocked<IClassSubjectAPIClient> = {
    listAssignedSubjects: vi.fn(),
    listUnassignedSubjects: vi.fn(),
    assignSubject: vi.fn(),
    updateAssignedSubject: vi.fn(),
    unassignSubject: vi.fn(),
};

/**
 * Mock implementation of {@link INotificationAPIClient}.
 */
export const mockNotificationApiClient: Mocked<INotificationAPIClient> = {
    getNotifications: vi.fn(() => Promise.resolve([])),
    getUnreadCount: vi.fn(() => Promise.resolve(0)),
    updateReadStatus: vi.fn(),
};

/**
 * Mock implementation of {@link IScheduleAPIClient}.
 */
export const mockScheduleApiClient: Mocked<IScheduleAPIClient> = {
    getById: vi.fn(),
    getSchedule: vi.fn(),
    download: vi.fn(),
    createSchedule: vi.fn(),
    updateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
};

/**
 * Mock implementation of {@link ISessionAPIClient}.
 */
export const mockSessionApiClient: Mocked<ISessionAPIClient> = {
    getActive: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    listSessions: vi.fn(() => Promise.resolve([])),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
};

/**
 * Mock implementation of {@link ISubjectAPIClient}.
 */
export const mockSubjectApiClient: Mocked<ISubjectAPIClient> = {
    getSubject: vi.fn(),
    getMySubjects: vi.fn(),
    listSubjects: vi.fn(),
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
};

/**
 * Mock implementation of {@link ISubjectDashboardAPIClient}.
 */
export const mockSubjectDashboardApiClient: Mocked<ISubjectDashboardAPIClient> =
    {
        getDashboard: vi.fn(),
    };

/**
 * Mock implementation of {@link ISubjectAssignmentAPIClient}.
 */
export const mockSubjectAssignmentApiClient: Mocked<ISubjectAssignmentAPIClient> =
    {
        getAssignment: vi.fn(),
        createAssignment: vi.fn(),
        updateAssignment: vi.fn(),
        deleteAssignment: vi.fn(),
    };

/**
 * Mock implementation of {@link ISubjectAssignmentSubmissionAPIClient}.
 */
export const mockSubjectAssignmentSubmissionApiClient: Mocked<ISubjectAssignmentSubmissionAPIClient> =
    {
        getSubmissions: vi.fn(),
        downloadSubmissions: vi.fn(),
        createSubmission: vi.fn(),
        updateSubmission: vi.fn(),
        deleteSubmission: vi.fn(),
    };

/**
 * Mock implementation of {@link ISubjectMaterialAPIClient}.
 */
export const mockSubjectMaterialApiClient: Mocked<ISubjectMaterialAPIClient> = {
    getMaterial: vi.fn(),
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
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
