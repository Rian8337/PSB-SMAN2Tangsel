import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { ISessionService } from "@/services";
import { ApiRequest, ApiResponse, BadRequestError } from "@/types";
import { listQuerySchema } from "@/validators";
import {
    AcademicSession,
    AcademicSessionDTO,
    UserRole,
} from "@psb/shared/types";
import {
    academicSessionDtoSchema,
    validSemesterSchema,
    validSessionSchema,
} from "@psb/shared/validator";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles academic session endpoints.
 */
@Controller("/sessions")
export class SessionController extends BaseController {
    constructor(
        @inject(dependencyTokens.sessionService)
        private readonly sessionService: ISessionService,
    ) {
        super();
    }

    /**
     * Obtains the currently active academic session.
     */
    @Get("/active")
    @Roles()
    async getActive(
        req: ApiRequest<unknown, AcademicSessionDTO>,
        res: ApiResponse<AcademicSessionDTO>,
    ) {
        try {
            const active = await this.sessionService.getActive();

            res.json(this.convertToDTO(active));
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Retrieves the details of a specific academic session and semester.
     */
    @Get("/")
    @Roles()
    async getSession(
        req: ApiRequest<
            unknown,
            AcademicSessionDTO,
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: ApiResponse<AcademicSessionDTO>,
    ) {
        try {
            const parsedSession = validSessionSchema.safeParse(
                decodeURIComponent(req.query.session ?? ""),
            );

            if (!parsedSession.success) {
                throw new BadRequestError(
                    parsedSession.error.issues[0].message as MessageKey,
                );
            }

            const parsedSemester = validSemesterSchema.safeParse(
                parseInt(req.query.semester ?? "", 10),
            );

            if (!parsedSemester.success) {
                throw new BadRequestError(
                    parsedSemester.error.issues[0].message as MessageKey,
                );
            }

            const sessionData = await this.sessionService.getSession(
                parsedSession.data,
                parsedSemester.data,
            );

            res.json(this.convertToDTO(sessionData));
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Lists academic sessions and semesters for display in the UI.
     */
    @Get("/list")
    @Roles(UserRole.administrator)
    async listSessions(
        req: ApiRequest<
            unknown,
            AcademicSessionDTO[],
            unknown,
            Partial<{ query?: string; limit?: string; offset?: string }>
        >,
        res: ApiResponse<AcademicSessionDTO[]>,
    ) {
        try {
            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const { query, limit, offset } = parsedQuery.data;

            const sessions = await this.sessionService.listSessions(
                query,
                limit,
                offset,
            );

            res.json(sessions.map((session) => this.convertToDTO(session)));
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Creates a new academic session. If `active` is set to `true`, it will deactivate any currently active session.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async createSession(
        req: ApiRequest<unknown, never, Partial<AcademicSessionDTO>>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedBody = academicSessionDtoSchema.safeParse(req.body);

            if (!parsedBody.success) {
                throw new BadRequestError();
            }

            const { session, semester, startTime, endTime, active } =
                parsedBody.data;

            await this.sessionService.createSession(
                session,
                semester,
                startTime,
                endTime,
                active,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the details of an existing academic session and semester. If `active` is set to `true`, it will deactivate any currently active session.
     */
    @Put("/")
    @Roles(UserRole.administrator)
    async updateSession(
        req: ApiRequest<unknown, never, Partial<AcademicSessionDTO>>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedBody = academicSessionDtoSchema.safeParse(req.body);

            if (!parsedBody.success) {
                throw new BadRequestError();
            }

            const { session, semester, startTime, endTime, active } =
                parsedBody.data;

            await this.sessionService.updateSession(
                session,
                semester,
                startTime,
                endTime,
                active,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes the specified academic session and semester.
     */
    @Delete("/")
    @Roles(UserRole.administrator)
    async deleteSession(
        req: ApiRequest<
            unknown,
            never,
            Partial<{ session: string; semester: number }>
        >,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedSession = validSessionSchema.safeParse(
                decodeURIComponent(req.body.session ?? ""),
            );

            if (!parsedSession.success) {
                throw new BadRequestError(
                    parsedSession.error.issues[0].message as MessageKey,
                );
            }

            const parsedSemester = validSemesterSchema.safeParse(
                req.body.semester,
            );

            if (!parsedSemester.success) {
                throw new BadRequestError(
                    parsedSemester.error.issues[0].message as MessageKey,
                );
            }

            await this.sessionService.deleteSession(
                parsedSession.data,
                parsedSemester.data,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    private convertToDTO(session: AcademicSession): AcademicSessionDTO {
        return {
            ...session,
            startTime: session.startTime.getTime(),
            endTime: session.endTime.getTime(),
            active: session.active ?? false,
        };
    }
}
