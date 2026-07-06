import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Patch, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IClassSubjectService, IUserService } from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
} from "@/types";
import {
    coercedUserIdSchema,
    createUserSchema,
    listQuerySchema,
    validIdentifierSchema,
    validNameSchema,
    validPasswordSchema,
    validRoleSchema,
} from "@/validators";
import { UserListItem, UserRole, UserSessionDTO } from "@psb/shared/types";
import { inject } from "tsyringe";
import z from "zod";
import { BaseController } from "./BaseController";

const listUsersValidationSchema = listQuerySchema.extend({
    role: z.coerce
        .number({ error: "controller.invalidRoleFormat" satisfies MessageKey })
        .pipe(validRoleSchema)
        .optional(),
});

/**
 * Controller that handles user-related endpoints.
 */
@Controller("/users")
export class UserController extends BaseController {
    constructor(
        @inject(dependencyTokens.userService)
        private readonly userService: IUserService,
        @inject(dependencyTokens.classSubjectService)
        private readonly classSubjectService: IClassSubjectService,
    ) {
        super();
    }

    /**
     * Returns the distinct academic sessions and semesters the authenticated user has data in.
     */
    @Get("/me/sessions")
    @Roles(UserRole.Student, UserRole.Teacher)
    async getMySessions(
        req: ApiRequest<unknown, UserSessionDTO[]>,
        res: ApiResponse<UserSessionDTO[]>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const { sessionData } = req;
            let sessions: UserSessionDTO[] = [];

            switch (sessionData.role) {
                case UserRole.Student:
                    sessions =
                        await this.classSubjectService.getStudentSessions(
                            sessionData.userId,
                        );
                    break;

                case UserRole.Teacher:
                    sessions =
                        await this.classSubjectService.getTeacherSessions(
                            sessionData.userId,
                        );
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.json(sessions);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Lists users for display in the UI.
     */
    @Get("/list")
    @Roles(UserRole.Administrator)
    async listUsers(
        req: ApiRequest<
            unknown,
            UserListItem[],
            unknown,
            Partial<{
                query?: string;
                limit?: string;
                offset?: string;
                role?: string;
            }>
        >,
        res: ApiResponse<UserListItem[]>,
    ) {
        try {
            const parsed = listUsersValidationSchema.safeParse(req.query);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const { role, query, limit, offset } = parsed.data;

            const users = await this.userService.listUsers(
                role,
                query,
                limit,
                offset,
            );

            res.json(users);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains detailed information about a specific user by their ID.
     */
    @Get("/:id")
    @Roles(UserRole.Administrator)
    async getUser(
        req: ApiRequest<{ id: string }, UserListItem>,
        res: ApiResponse<UserListItem>,
    ) {
        try {
            const parsedId = coercedUserIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const user = await this.userService.findById(parsedId.data);

            res.json({
                id: user.id,
                active: user.active,
                name: user.name,
                role: user.role,
                identifier: user.identifier,
            });
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Registers a new user.
     */
    @Post("/create")
    @Roles(UserRole.Administrator)
    async createUser(
        req: ApiRequest<
            unknown,
            never,
            Partial<{
                name: string;
                password: string;
                role: UserRole;
                identifier: string;
            }>
        >,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedData = createUserSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError(
                    parsedData.error.issues[0].message as MessageKey,
                );
            }

            const { name, password, role, identifier } = parsedData.data;

            await this.userService.create(name, password, role, identifier);

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the password of the currently authenticated user.
     */
    @Patch("/update-password")
    @Roles()
    async updatePassword(
        req: ApiRequest<
            unknown,
            never,
            Partial<{ currentPassword: string; newPassword: string }>
        >,
        res: ApiResponse<never>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedCurrentPassword = validPasswordSchema.safeParse(
                req.body.currentPassword,
            );

            if (!parsedCurrentPassword.success) {
                throw new BadRequestError(
                    parsedCurrentPassword.error.issues[0].message as MessageKey,
                );
            }

            const parsedNewPassword = validPasswordSchema.safeParse(
                req.body.newPassword,
            );

            if (!parsedNewPassword.success) {
                throw new BadRequestError(
                    parsedNewPassword.error.issues[0].message as MessageKey,
                );
            }

            await this.userService.updatePassword(
                req.sessionData.userId,
                parsedCurrentPassword.data,
                parsedNewPassword.data,
            );

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates a user's name and active state.
     */
    @Patch("/:id")
    @Roles(UserRole.Administrator)
    async updateUser(
        req: ApiRequest<
            { id: string },
            never,
            Partial<{ name: string; identifier: string; active: boolean }>
        >,
        res: ApiResponse<never>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedUserIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsedName = validNameSchema.safeParse(req.body.name);

            if (!parsedName.success) {
                throw new BadRequestError(
                    parsedName.error.issues[0].message as MessageKey,
                );
            }

            const parsedIdentifier = validIdentifierSchema.safeParse(
                req.body.identifier,
            );

            if (!parsedIdentifier.success) {
                throw new BadRequestError(
                    parsedIdentifier.error.issues[0].message as MessageKey,
                );
            }

            const { active } = req.body;

            if (typeof active !== "boolean") {
                throw new BadRequestError();
            }

            await this.userService.update(
                parsedId.data,
                parsedName.data,
                parsedIdentifier.data,
                active,
                req.sessionData.userId,
            );

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes a user.
     */
    @Delete("/:id")
    @Roles(UserRole.Administrator)
    async deleteUser(
        req: ApiRequest<{ id: string }, never>,
        res: ApiResponse<never>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const paramsId = coercedUserIdSchema.safeParse(req.params.id);

            if (!paramsId.success) {
                throw new BadRequestError(
                    paramsId.error.issues[0].message as MessageKey,
                );
            }

            await this.userService.delete(
                paramsId.data,
                req.sessionData.userId,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
