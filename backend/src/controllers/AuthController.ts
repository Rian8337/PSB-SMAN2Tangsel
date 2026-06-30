import { Controller } from "@/decorators/controller";
import { Use } from "@/decorators/middleware";
import { Roles } from "@/decorators/roles";
import { Get, Post } from "@/decorators/routes";
import { getContainer } from "@/dependencies/container";
import { dependencyTokens } from "@/dependencies/tokens";
import { IUserService } from "@/services";
import { IAuthService } from "@/services/IAuthService";
import { ApiRequest, ApiResponse, EnvironmentVariableKey } from "@/types";
import { LoginResponseBody } from "@psb/shared/types";
import rateLimit from "express-rate-limit";
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
    @Use(
        rateLimit({
            windowMs: 5000,
            max: 5,
            // Don't apply rate limiting if we're running in E2E test mode, to avoid interfering with tests
            skip: () => {
                const configService = getContainer().resolve(
                    dependencyTokens.configService,
                );

                return (
                    configService.getEnvironmentVariable(
                        EnvironmentVariableKey.nodeEnv,
                    ) !== "production" ||
                    configService.getEnvironmentVariable(
                        EnvironmentVariableKey.isE2ETest,
                    ) === "true"
                );
            },
            handler: (req, res) => {
                res.status(429).json({ error: req.t("auth.tooManyAttempts") });
            },
            standardHeaders: true,
            legacyHeaders: false,
        }),
    )
    async login(
        req: ApiRequest<
            unknown,
            LoginResponseBody,
            Partial<{ id: string; password: string }>
        >,
        res: ApiResponse<LoginResponseBody>,
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
    logout(_req: ApiRequest, res: ApiResponse) {
        this.authService.clearSession(res);

        res.json({ message: "Logged out successfully." });
    }

    /**
     * Returns the currently authenticated user's information.
     */
    @Get("/me")
    @Roles()
    async me(req: ApiRequest<unknown>, res: ApiResponse<LoginResponseBody>) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const user = await this.userService.findById(
                req.sessionData.userId,
            );

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
