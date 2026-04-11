import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Patch, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IClassSubjectService } from "@/services";
import { BadRequestError } from "@/types";
import { ClassSubjectAssignment, Subject, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles endpoints related to subject management of classes.
 */
@Controller("/class-subjects")
export class ClassSubjectController extends BaseController {
    constructor(
        @inject(dependencyTokens.classSubjectService)
        private readonly classSubjectService: IClassSubjectService,
    ) {
        super();
    }

    /**
     * Obtains a list of subjects assigned to a specific class, optionally filtered by a search query and paginated with limit and offset parameters.
     */
    @Get("/:id/assigned")
    @Roles(UserRole.administrator)
    async listAssignedSubjects(
        req: Request<
            { id: string },
            ClassSubjectAssignment[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<ClassSubjectAssignment[] | { error: string }>,
    ) {
        try {
            const classId = parseInt(req.params.id, 10);

            if (Number.isNaN(classId) || classId <= 0) {
                throw new BadRequestError("classController.invalidId");
            }

            const query = req.query.query
                ? decodeURIComponent(req.query.query)
                : undefined;

            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

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

            const subjects =
                await this.classSubjectService.listAssignedSubjects(
                    classId,
                    query,
                    limit,
                    offset,
                );

            res.json(subjects);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Lists subjects that are not yet assigned to a specific class for display in the subject selection dropdown when assigning subjects to a class.
     */
    @Get("/:id/unassigned")
    @Roles(UserRole.administrator)
    async listUnassignedSubjects(
        req: Request<
            { id: string },
            Subject[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<Subject[] | { error: string }>,
    ) {
        try {
            const classId = parseInt(req.params.id, 10);

            if (Number.isNaN(classId) || classId <= 0) {
                throw new BadRequestError("classController.invalidId");
            }

            const query = req.query.query
                ? decodeURIComponent(req.query.query)
                : undefined;

            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

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

            const subjects =
                await this.classSubjectService.listUnassignedSubjects(
                    classId,
                    query,
                    limit,
                    offset,
                );

            res.json(subjects);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Assigns a subject to a class. If the teacher ID is not provided, the subject will be assigned to the class without a teacher.
     */
    @Post("/:id")
    @Roles(UserRole.administrator)
    async assignSubject(
        req: Request<
            { id: string },
            { error: string },
            Partial<{ subjectId: number; teacherId: number | null }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const classId = parseInt(req.params.id, 10);

            if (Number.isNaN(classId) || classId <= 0) {
                throw new BadRequestError("classController.invalidId");
            }

            const { subjectId, teacherId } = req.body;

            if (
                subjectId === undefined ||
                Number.isNaN(subjectId) ||
                subjectId <= 0
            ) {
                throw new BadRequestError("subjectController.invalidSubjectId");
            }

            if (
                teacherId !== null &&
                (teacherId === undefined ||
                    Number.isNaN(teacherId) ||
                    teacherId <= 0)
            ) {
                throw new BadRequestError("userController.invalidUserId");
            }

            await this.classSubjectService.assignSubject(
                classId,
                subjectId,
                teacherId,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the teacher assigned to a class subject. If the teacher ID is not provided, the subject will be unassigned from any teacher.
     */
    @Patch("/:id")
    @Roles(UserRole.administrator)
    async updateAssignedSubject(
        req: Request<
            { id: string },
            { error: string },
            Partial<{ teacherId: number | null }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const assignmentId = parseInt(req.params.id, 10);

            if (Number.isNaN(assignmentId) || assignmentId <= 0) {
                throw new BadRequestError(
                    "classSubjectController.invalidAssignmentId",
                );
            }

            const { teacherId } = req.body;

            if (
                teacherId !== null &&
                (teacherId === undefined ||
                    Number.isNaN(teacherId) ||
                    teacherId <= 0)
            ) {
                throw new BadRequestError("userController.invalidUserId");
            }

            await this.classSubjectService.updateAssignedSubject(
                assignmentId,
                teacherId,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Removes a subject assignment from a class. This operation is only possible if there are no assignments and materials associated with
     * the class subject assignment.
     */
    @Delete("/:id")
    @Roles(UserRole.administrator)
    async unassignSubject(
        req: Request<{ id: string }, { error: string }>,
        res: Response<{ error: string }>,
    ) {
        try {
            const assignmentId = parseInt(req.params.id, 10);

            if (Number.isNaN(assignmentId) || assignmentId <= 0) {
                throw new BadRequestError(
                    "classSubjectController.invalidAssignmentId",
                );
            }

            await this.classSubjectService.unassignSubject(assignmentId);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
