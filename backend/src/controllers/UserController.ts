import { Controller } from "@/decorators/controller";
import { BaseController } from "./BaseController";
import { inject } from "tsyringe";
import { dependencyTokens } from "@/dependencies/tokens";
import { IUserService } from "@/services";
import { Get, Post } from "@/decorators/routes";
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
            Partial<{ limit?: string; offset?: string }>
        >,
        res: Response<UserListItem[] | { error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
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

            const users = await this.userService.listUsers(limit, offset);

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

            if (!name || !password || role === undefined || !identifier) {
                throw new BadRequestError("http.badRequest");
            }

            await this.userService.create(name, password, role, identifier);

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
