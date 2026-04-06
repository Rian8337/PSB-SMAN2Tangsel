import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { ISessionService } from "@/services";
import { BadRequestError } from "@/types";
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
import { Request, Response } from "express";
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
        req: Request<unknown, AcademicSessionDTO | { error: string }>,
        res: Response<AcademicSessionDTO | { error: string }>,
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
        req: Request<
            unknown,
            AcademicSessionDTO | { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: Response<AcademicSessionDTO | { error: string }>,
    ) {
        try {
            const { session, semester } = req.query;
            const parsedSession = validSessionSchema.safeParse(session);

            if (!parsedSession.success) {
                throw new BadRequestError();
            }

            const parsedSemester = validSemesterSchema.safeParse(semester);

            if (!parsedSemester.success) {
                throw new BadRequestError();
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
        req: Request<
            unknown,
            AcademicSessionDTO[] | { error: string },
            unknown,
            Partial<{ query?: string; limit?: string; offset?: string }>
        >,
        res: Response<AcademicSessionDTO[] | { error: string }>,
    ) {
        try {
            const { query } = req.query;

            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

            if (query !== undefined && typeof query !== "string") {
                throw new BadRequestError("controller.invalidQueryFormat");
            }

            if (limit !== undefined) {
                if (Number.isNaN(limit)) {
                    throw new BadRequestError("controller.invalidLimitFormat");
                }

                if (limit <= 0 || limit > 50) {
                    throw new BadRequestError("controller.invalidLimitRange");
                }
            }

            if (offset !== undefined) {
                if (Number.isNaN(offset)) {
                    throw new BadRequestError("controller.invalidOffsetFormat");
                }

                if (offset < 0) {
                    throw new BadRequestError("controller.invalidOffsetRange");
                }
            }

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
        req: Request<unknown, { error: string }, Partial<AcademicSessionDTO>>,
        res: Response<{ error: string }>,
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
        req: Request<unknown, { error: string }, Partial<AcademicSessionDTO>>,
        res: Response<{ error: string }>,
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
        req: Request<
            unknown,
            { error: string },
            Partial<{ session: string; semester: number }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const { session, semester } = req.body;

            if (typeof session !== "string" || typeof semester !== "number") {
                throw new BadRequestError();
            }

            const parsedSession = validSessionSchema.parse(session);
            const parsedSemester = validSemesterSchema.parse(semester);

            await this.sessionService.deleteSession(
                parsedSession,
                parsedSemester,
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
