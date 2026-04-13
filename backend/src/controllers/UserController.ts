import { Controller } from "@/decorators/controller";
import { BaseController } from "./BaseController";
import { inject } from "tsyringe";
import { dependencyTokens } from "@/dependencies/tokens";
import { IUserService } from "@/services";
import { Delete, Get, Patch, Post } from "@/decorators/routes";
import { Roles } from "@/decorators/roles";
import { UserListItem, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { BadRequestError } from "@/types";
import { listQuerySchema } from "@/validators";
import { validRoleSchema } from "@psb/shared/validator";
import { MessageKey } from "@/i18n";

const listUsersValidationSchema = listQuerySchema.extend({
    role: validRoleSchema.optional(),
});

/**
 * Controller that handles user-related endpoints.
 */
@Controller("/users")
export class UserController extends BaseController {
    constructor(
        @inject(dependencyTokens.userService)
        private readonly userService: IUserService,
    ) {
        super();
    }

    /**
     * Lists users for display in the UI.
     */
    @Get("/list")
    @Roles(UserRole.administrator)
    async listUsers(
        req: Request<
            unknown,
            UserListItem[] | { error: string },
            unknown,
            Partial<{
                query?: string;
                limit?: string;
                offset?: string;
                role?: string;
            }>
        >,
        res: Response<UserListItem[] | { error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

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
    @Roles(UserRole.administrator)
    async getUser(
        req: Request<{ id: string }, UserListItem | { error: string }>,
        res: Response<UserListItem | { error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const userId = parseInt(req.params.id, 10);

            if (Number.isNaN(userId) || userId <= 0) {
                throw new BadRequestError("userController.invalidUserId");
            }

            const user = await this.userService.findById(userId);

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
    @Roles(UserRole.administrator)
    async createUser(
        req: Request<
            unknown,
            { error: string },
            Partial<{
                name: string;
                password: string;
                role: UserRole;
                identifier: string;
            }>
        >,
        res: Response<{ error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const { name, password, role, identifier } = req.body;

            if (
                typeof name !== "string" ||
                typeof password !== "string" ||
                typeof role !== "number" ||
                typeof identifier !== "string"
            ) {
                throw new BadRequestError();
            }

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
        req: Request<
            unknown,
            { error: string },
            Partial<{ currentPassword: string; newPassword: string }>
        >,
        res: Response<{ error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const { currentPassword, newPassword } = req.body;

            if (
                typeof currentPassword !== "string" ||
                typeof newPassword !== "string"
            ) {
                throw new BadRequestError();
            }

            await this.userService.updatePassword(
                req.sessionData.userId,
                currentPassword,
                newPassword,
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
    @Roles(UserRole.administrator)
    async updateUser(
        req: Request<
            { id: string },
            { error: string },
            Partial<{ name: string; active: boolean }>
        >,
        res: Response<{ error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const userId = parseInt(req.params.id, 10);
            const { name, active } = req.body;

            if (
                Number.isNaN(userId) ||
                userId <= 0 ||
                typeof name !== "string" ||
                typeof active !== "boolean"
            ) {
                throw new BadRequestError();
            }

            await this.userService.update(userId, name, active);

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes a user.
     */
    @Delete("/:id")
    @Roles(UserRole.administrator)
    async deleteUser(
        req: Request<{ id: string }, { error: string }>,
        res: Response<{ error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const userId = parseInt(req.params.id, 10);

            if (Number.isNaN(userId) || userId <= 0) {
                throw new BadRequestError();
            }

            await this.userService.delete(userId);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
