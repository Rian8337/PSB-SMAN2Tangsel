import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import {
    IClassSubjectService,
    ISessionService,
    ISubjectService,
} from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
    UnauthorizedError,
} from "@/types";
import { coercedSubjectIdSchema, listQuerySchema } from "@/validators";
import { ClassSubjectAssignment, Subject, UserRole } from "@psb/shared/types";
import { insertSubjectSchema } from "@psb/shared/validator";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles subject endpoints.
 */
@Controller("/subjects")
export class SubjectController extends BaseController {
    constructor(
        @inject(dependencyTokens.subjectService)
        private readonly subjectService: ISubjectService,
        @inject(dependencyTokens.classSubjectService)
        private readonly classSubjectService: IClassSubjectService,
        @inject(dependencyTokens.sessionService)
        private readonly sessionService: ISessionService,
    ) {
        super();
    }

    /**
     * Obtains the subjects for the currently authenticated user.
     */
    @Get("/me")
    @Roles(UserRole.student, UserRole.teacher)
    async getMySubjects(
        req: ApiRequest<
            unknown,
            ClassSubjectAssignment[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: ApiResponse<ClassSubjectAssignment[]>,
    ) {
        try {
            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const { query, limit, offset } = parsedQuery.data;
            const sessionData = req.sessionData;

            if (!sessionData) {
                throw new UnauthorizedError();
            }

            let subjects: ClassSubjectAssignment[] = [];

            switch (sessionData.role) {
                case UserRole.student:
                    if (typeof sessionData.classId === "number") {
                        subjects =
                            await this.classSubjectService.listAssignedSubjects(
                                sessionData.classId,
                                query,
                                limit,
                                offset,
                            );
                    }
                    break;

                case UserRole.teacher:
                    {
                        const activeSession =
                            await this.sessionService.getActive();

                        subjects =
                            await this.classSubjectService.listAssignedSubjectsForTeacher(
                                sessionData.userId,
                                activeSession.session,
                                activeSession.semester,
                                query,
                                limit,
                                offset,
                            );
                    }
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.json(subjects);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Lists subjects for display in the UI.
     */
    @Get("/list")
    @Roles()
    async listSubjects(
        req: ApiRequest<
            unknown,
            Subject[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: ApiResponse<Subject[]>,
    ) {
        try {
            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const subjects = await this.subjectService.listSubjects(
                parsedQuery.data.query,
                parsedQuery.data.limit,
                parsedQuery.data.offset,
            );

            res.json(subjects);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains detailed information about a specific subject by their ID.
     */
    @Get("/:id")
    @Roles()
    async getSubject(
        req: ApiRequest<{ id: string }, Subject>,
        res: ApiResponse<Subject>,
    ) {
        try {
            const parsedId = coercedSubjectIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const subject = await this.subjectService.findById(parsedId.data);

            res.json(subject);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Creates a new subject.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async createSubject(
        req: ApiRequest<unknown, never, Partial<Subject>>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedData = insertSubjectSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError();
            }

            await this.subjectService.createSubject(
                parsedData.data.code,
                parsedData.data.name,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates an existing subject.
     */
    @Put("/:id")
    @Roles(UserRole.administrator)
    async updateSubject(
        req: ApiRequest<{ id: string }, never, Partial<Subject>>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedId = coercedSubjectIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsedData = insertSubjectSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError();
            }

            await this.subjectService.updateSubject(
                parsedId.data,
                parsedData.data.code,
                parsedData.data.name,
                parsedData.data.active ?? true,
            );

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes a subject.
     */
    @Delete("/:id")
    @Roles(UserRole.administrator)
    async deleteSubject(
        req: ApiRequest<{ id: string }, never>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedId = coercedSubjectIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            await this.subjectService.deleteSubject(parsedId.data);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
