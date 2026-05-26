import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IStudentRepository, IUserRepository } from "@/repositories";
import {
    EnvironmentVariableKey,
    LoginResult,
    UnauthorizedError,
} from "@/types";
import {
    ApiErrorBody,
    SessionCookie,
    SessionData,
    UserRole,
} from "@psb/shared/types";
import { sessionDataValidator } from "@psb/shared/validator";
import { compare, hashSync } from "bcrypt";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { RequestHandler, Response } from "express";
import { inject } from "tsyringe";
import { IAuthService } from "./IAuthService";
import { IConfigService } from "./IConfigService";

/**
 * A service that handles authentication using encrypted, signed session cookies.
 *
 * Session data is encrypted with AES-256-GCM using the `SESSION_ENCRYPTION_KEY`
 * environment variable, then stored in a signed httpOnly cookie.
 */
@Injectable(dependencyTokens.authService)
export class AuthService implements IAuthService {
    private readonly sessionCookieName = "session";
    private readonly sessionTtlMs = 2 * 60 * 60 * 1000;
    private readonly algorithm = "aes-256-gcm";
    private readonly ivLength = 12;
    private readonly authTagLength = 16;

    private readonly dummyHash = hashSync(randomBytes(32).toString("hex"), 12);

    private readonly encryptionKey: Buffer;
    private readonly requireSameSiteCookies: boolean;
    private readonly requireSecureCookies: boolean;

    constructor(
        @inject(dependencyTokens.configService)
        private readonly configService: IConfigService,
        @inject(dependencyTokens.userRepository)
        private readonly userRepository: IUserRepository,
        @inject(dependencyTokens.studentRepository)
        private readonly studentRepository: IStudentRepository,
    ) {
        const keyHex = this.configService.getEnvironmentVariable(
            EnvironmentVariableKey.sessionEncryptionKey,
            true,
        );

        this.encryptionKey = Buffer.from(keyHex, "hex");

        if (this.encryptionKey.length !== 32) {
            throw new Error(
                "SESSION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).",
            );
        }

        // SameSite cookies must be disabled in end-to-end test mode to allow WebKit Playwright to access the cookies.
        this.requireSameSiteCookies =
            this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.nodeEnv,
            ) === "production" &&
            this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.isE2ETest,
            ) !== "true";

        // Secure cookies must be disabled in end-to-end test mode to allow WebKit Playwright to access the cookies.
        this.requireSecureCookies =
            this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.nodeEnv,
            ) === "production" &&
            this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.isE2ETest,
            ) !== "true";
    }

    async login(id: string, password: string): Promise<LoginResult> {
        const user = await this.userRepository.findByIdentifier(id);

        if (!user?.active) {
            await this.simulatePasswordHashingDelay();
            throw new UnauthorizedError("auth.invalidCredentials");
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError("auth.invalidCredentials");
        }

        let sessionData: SessionData;

        switch (user.role) {
            case UserRole.student:
                sessionData = {
                    userId: user.id,
                    identifier: user.identifier,
                    role: user.role,
                    classId:
                        (await this.studentRepository.getClassId(user.id)) ??
                        undefined,
                };
                break;

            case UserRole.teacher:
            case UserRole.administrator:
                sessionData = {
                    userId: user.id,
                    identifier: user.identifier,
                    role: user.role,
                };
                break;
        }

        return { user, sessionData };
    }

    createSession(res: Response, data: unknown): void {
        const expiresAt = Date.now() + this.sessionTtlMs;
        const sessionData: SessionCookie = { data, expiresAt };

        res.cookie(this.sessionCookieName, this.encryptSession(sessionData), {
            httpOnly: true,
            secure: this.requireSecureCookies,
            sameSite: this.requireSameSiteCookies ? "strict" : "lax",
            signed: true,
            maxAge: this.sessionTtlMs,
        });
    }

    clearSession(res: Response): void {
        res.clearCookie(this.sessionCookieName, {
            httpOnly: true,
            secure: this.requireSecureCookies,
            sameSite: this.requireSameSiteCookies ? "strict" : "lax",
            signed: true,
        });
    }

    verifySession(
        ...allowedRoles: UserRole[]
    ): RequestHandler<unknown, ApiErrorBody> {
        return (req, res, next) => {
            const token = (
                req.signedCookies as Record<string, string | undefined>
            )[this.sessionCookieName];

            if (!token) {
                res.status(401).json({ error: req.t("http.unauthorized") });
                return;
            }

            try {
                const { data, expiresAt } = this.decryptSession(token);

                if (Date.now() > expiresAt) {
                    this.clearSession(res);

                    res.status(401).json({
                        error: req.t("auth.sessionExpired"),
                    });

                    return;
                }

                req.sessionData = data;

                // Renew the session if more than 25% of the session TTL has elapsed.
                if (expiresAt - Date.now() < this.sessionTtlMs * 0.75) {
                    this.createSession(res, data);
                }

                if (
                    allowedRoles.length > 0 &&
                    !allowedRoles.includes(data.role)
                ) {
                    res.status(403).json({ error: req.t("http.forbidden") });
                    return;
                }

                next();
            } catch {
                this.clearSession(res);

                res.status(401).json({ error: req.t("auth.sessionExpired") });
            }
        };
    }

    encryptSession(data: unknown): string {
        const plaintext = JSON.stringify(data);
        const iv = randomBytes(this.ivLength);
        const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext, "utf8"),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        // Format: base64url(iv + authTag + ciphertext)
        return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
    }

    decryptSession(token: string): {
        readonly data: SessionData;
        readonly expiresAt: number;
    } {
        const raw = Buffer.from(token, "base64url");
        const iv = raw.subarray(0, this.ivLength);
        const authTag = raw.subarray(
            this.ivLength,
            this.ivLength + this.authTagLength,
        );

        const ciphertext = raw.subarray(this.ivLength + this.authTagLength);

        const decipher = createDecipheriv(
            this.algorithm,
            this.encryptionKey,
            iv,
        );

        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);

        try {
            const rawJson = JSON.parse(decrypted.toString("utf8")) as {
                data?: unknown;
                expiresAt?: unknown;
            };

            if (
                typeof rawJson !== "object" ||
                typeof rawJson.expiresAt !== "number" ||
                !rawJson.data
            ) {
                throw new UnauthorizedError();
            }

            const data = sessionDataValidator.parse(rawJson.data);

            return { data, expiresAt: rawJson.expiresAt };
        } catch (e) {
            if (e instanceof UnauthorizedError) {
                throw e;
            }

            throw new UnauthorizedError("auth.invalidSession");
        }
    }

    private async simulatePasswordHashingDelay() {
        // Perform a dummy hash comparison to simulate the time taken by bcrypt hashing,
        // preventing user enumeration through timing attacks.
        await compare("dummyPassword", this.dummyHash);
    }
}
