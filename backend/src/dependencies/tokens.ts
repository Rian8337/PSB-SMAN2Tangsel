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
    IUserRepository,
} from "@/repositories";
import {
    IAssignmentService,
    IAttachmentService,
    IAuthService,
    IClassService,
    IClassStudentService,
    IClassSubjectService,
    IConfigService,
    IFileService,
    IMaterialService,
    INotificationService,
    IScheduleService,
    ISessionService,
    ISubmissionService,
    ISubjectService,
    IUserService,
} from "@/services";
import { DrizzleDb } from "@psb/shared/types";
import { InjectionToken } from "tsyringe";

/**
 * Tokens for dependency injection.
 */
export const dependencyTokens = {
    /**
     * Injection token for a Drizzle database instance.
     */
    db: Symbol.for("drizzleDb") as InjectionToken<DrizzleDb>,

    //#region Repositories

    /**
     * Injection token for an {@link IAdministratorRepository}.
     */
    administratorRepository: Symbol.for(
        "administratorRepository",
    ) as InjectionToken<IAdministratorRepository>,

    /**
     * Injection token for an {@link IAssignmentRepository}.
     */
    assignmentRepository: Symbol.for(
        "assignmentRepository",
    ) as InjectionToken<IAssignmentRepository>,

    /**
     * Injection token for an {@link IAttachmentRepository}.
     */
    attachmentRepository: Symbol.for(
        "attachmentRepository",
    ) as InjectionToken<IAttachmentRepository>,

    /**
     * Injection token for an {@link IFileRepository}.
     */
    fileRepository: Symbol.for(
        "fileRepository",
    ) as InjectionToken<IFileRepository>,

    /**
     * Injection token for an {@link IClassRepository}.
     */
    classRepository: Symbol.for(
        "classRepository",
    ) as InjectionToken<IClassRepository>,

    /**
     * Injection token for an {@link IClassSubjectRepository}.
     */
    classSubjectRepository: Symbol.for(
        "classSubjectRepository",
    ) as InjectionToken<IClassSubjectRepository>,

    /**
     * Injection token for an {@link IClassStudentRepository}.
     */
    classStudentRepository: Symbol.for(
        "classStudentRepository",
    ) as InjectionToken<IClassStudentRepository>,

    /**
     * Injection token for an {@link IMaterialRepository}.
     */
    materialRepository: Symbol.for(
        "materialRepository",
    ) as InjectionToken<IMaterialRepository>,

    /**
     * Injection token for an {@link INotificationRepository}.
     */
    notificationRepository: Symbol.for(
        "notificationRepository",
    ) as InjectionToken<INotificationRepository>,

    /**
     * Injection token for an {@link IScheduleRepository}.
     */
    scheduleRepository: Symbol.for(
        "scheduleRepository",
    ) as InjectionToken<IScheduleRepository>,

    /**
     * Injection token for an {@link ISessionRepository}.
     */
    sessionRepository: Symbol.for(
        "sessionRepository",
    ) as InjectionToken<ISessionRepository>,

    /**
     * Injection token for an {@link ISubjectRepository}.
     */
    subjectRepository: Symbol.for(
        "subjectRepository",
    ) as InjectionToken<ISubjectRepository>,

    /**
     * Injection token for an {@link IStudentRepository}.
     */
    studentRepository: Symbol.for(
        "studentRepository",
    ) as InjectionToken<IStudentRepository>,

    /**
     * Injection token for an {@link ISubmissionRepository}.
     */
    submissionRepository: Symbol.for(
        "submissionRepository",
    ) as InjectionToken<ISubmissionRepository>,

    /**
     * Injection token for an {@link ITeacherRepository}.
     */
    teacherRepository: Symbol.for(
        "teacherRepository",
    ) as InjectionToken<ITeacherRepository>,

    /**
     * Injection token for an {@link IUserRepository}.
     */
    userRepository: Symbol.for(
        "userRepository",
    ) as InjectionToken<IUserRepository>,

    //#endregion

    //#region Services

    /**
     * Injection token for an {@link IAssignmentService}.
     */
    assignmentService: Symbol.for(
        "assignmentService",
    ) as InjectionToken<IAssignmentService>,

    /**
     * Injection token for an {@link IAttachmentService}.
     */
    attachmentService: Symbol.for(
        "attachmentService",
    ) as InjectionToken<IAttachmentService>,

    /**
     * Injection token for an {@link IAuthService}.
     */
    authService: Symbol.for("authService") as InjectionToken<IAuthService>,

    /**
     * Injection token for an {@link IClassService}.
     */
    classService: Symbol.for("classService") as InjectionToken<IClassService>,

    /**
     * Injection token for an {@link IClassSubjectService}.
     */
    classSubjectService: Symbol.for(
        "classSubjectService",
    ) as InjectionToken<IClassSubjectService>,

    /**
     * Injection token for an {@link IClassStudentService}.
     */
    classStudentService: Symbol.for(
        "classStudentService",
    ) as InjectionToken<IClassStudentService>,

    /**
     * Injection token for an {@link IConfigService}.
     */
    configService: Symbol.for(
        "configService",
    ) as InjectionToken<IConfigService>,

    /**
     * Injection token for an {@link IMaterialService}.
     */
    materialService: Symbol.for(
        "materialService",
    ) as InjectionToken<IMaterialService>,

    /**
     * Injection token for an {@link INotificationService}.
     */
    notificationService: Symbol.for(
        "notificationService",
    ) as InjectionToken<INotificationService>,

    /**
     * Injection token for an {@link IScheduleService}.
     */
    scheduleService: Symbol.for(
        "scheduleService",
    ) as InjectionToken<IScheduleService>,

    /**
     * Injection token for an {@link ISessionService}.
     */
    sessionService: Symbol.for(
        "sessionService",
    ) as InjectionToken<ISessionService>,

    /**
     * Injection token for an {@link IFileService}.
     */
    fileService: Symbol.for("fileService") as InjectionToken<IFileService>,

    /**
     * Injection token for an {@link ISubmissionService}.
     */
    submissionService: Symbol.for(
        "submissionService",
    ) as InjectionToken<ISubmissionService>,

    /**
     * Injection token for an {@link ISubjectService}.
     */
    subjectService: Symbol.for(
        "subjectService",
    ) as InjectionToken<ISubjectService>,

    /**
     * Injection token for an {@link IUserService}.
     */
    userService: Symbol.for("userService") as InjectionToken<IUserService>,

    //#endregion
} as const;
