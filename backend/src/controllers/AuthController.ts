import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IUserService } from "@/services";
import { IAuthService } from "@/services/IAuthService";
import { LoginResponseBody } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles authentication endpoints.
 */
@Controller("/auth")
export class AuthController extends BaseController {
    constructor(
        @inject(dependencyTokens.authService)
        private readonly authService: IAuthService,
        @inject(dependencyTokens.userService)
        private readonly userService: IUserService,
    ) {
        super();
    }

    /**
     * Authenticates a user with their name and password, then creates a session cookie.
     */
    @Post("/login")
    async login(
        req: Request<
            "/login",
            LoginResponseBody,
            Partial<{ id: string; password: string }>
        >,
        res: Response<LoginResponseBody>,
    ) {
        const { id, password } = req.body;

        if (!id || !password) {
            res.status(400).json({ error: "ID and password are required." });
            return;
        }

        try {
            const loginData = await this.authService.login(id, password);

            this.authService.createSession(res, loginData.sessionData);

            res.json({
                id: loginData.user.id,
                name: loginData.user.name,
                role: loginData.user.role,
            });
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Destroys the current session cookie, logging the user out.
     */
    @Post("/logout")
    logout(_req: Request, res: Response) {
        this.authService.clearSession(res);

        res.json({ message: "Logged out successfully." });
    }

    /**
     * Returns the currently authenticated user's information.
     */
    @Get("/me")
    @Roles()
    async me(req: Request, res: Response<LoginResponseBody>) {
        const { sessionData } = req;

        if (!sessionData) {
            res.status(401).json({ error: "Not authenticated." });
            return;
        }

        try {
            const user = await this.userService.findById(sessionData.userId);

            if (!user.active) {
                res.status(401).json({ error: "User not found." });
                return;
            }

            res.json({
                id: user.id,
                name: user.name,
                role: user.role,
            });
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
