import {
    IAdministratorRepository,
    IScheduleRepository,
    ISessionRepository,
    IStudentRepository,
    ITeacherRepository,
    IUserRepository,
} from "@/repositories";
import {
    IAuthService,
    IConfigService,
    IScheduleService,
    ISessionService,
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
     * Injection token for an {@link IStudentRepository}.
     */
    studentRepository: Symbol.for(
        "studentRepository",
    ) as InjectionToken<IStudentRepository>,

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
     * Injection token for an {@link IAuthService}.
     */
    authService: Symbol.for("authService") as InjectionToken<IAuthService>,

    /**
     * Injection token for an {@link IConfigService}.
     */
    configService: Symbol.for(
        "configService",
    ) as InjectionToken<IConfigService>,

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
     * Injection token for an {@link IUserService}.
     */
    userService: Symbol.for("userService") as InjectionToken<IUserService>,

    //#endregion
} as const;
