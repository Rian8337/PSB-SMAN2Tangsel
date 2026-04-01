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
            Partial<{ query?: string; limit?: string; offset?: string }>
        >,
        res: Response<UserListItem[] | { error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const { query } = req.query;

            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

            if (query !== undefined && typeof query !== "string") {
                throw new BadRequestError("userController.invalidQueryFormat");
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

            const users = await this.userService.listUsers(
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
     * Updates the active state of an existing user.
     */
    @Patch("/update-active-state")
    @Roles(UserRole.administrator)
    async updateActiveState(
        req: Request<
            unknown,
            { error: string },
            Partial<{ userId: number; active: boolean }>
        >,
        res: Response<{ error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const { userId, active } = req.body;

            if (
                typeof userId !== "number" ||
                Number.isNaN(userId) ||
                userId <= 0 ||
                typeof active !== "boolean"
            ) {
                throw new BadRequestError();
            }

            await this.userService.updateActiveState(userId, active);

            res.sendStatus(200);
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
