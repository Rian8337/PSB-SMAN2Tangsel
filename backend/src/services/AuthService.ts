import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    IAdministratorRepository,
    IStudentRepository,
    ITeacherRepository,
} from "@/repositories";
import {
    EnvironmentVariableKey,
    ForbiddenError,
    LoginResult,
    SessionData,
    UnauthorizedError,
} from "@/types";
import { User, UserRole } from "@psb/shared/types";
import { compare } from "bcrypt";
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
    private readonly algorithm = "aes-256-gcm";
    private readonly ivLength = 12;
    private readonly authTagLength = 16;

    private readonly encryptionKey: Buffer;
    private readonly isProduction: boolean;

    constructor(
        @inject(dependencyTokens.configService)
        private readonly configService: IConfigService,
        @inject(dependencyTokens.studentRepository)
        private readonly studentRepository: IStudentRepository,
        @inject(dependencyTokens.teacherRepository)
        private readonly teacherRepository: ITeacherRepository,
        @inject(dependencyTokens.administratorRepository)
        private readonly administratorRepository: IAdministratorRepository,
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

        this.isProduction =
            this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.nodeEnv,
            ) === "production";
    }

    async login(id: string, password: string): Promise<LoginResult> {
        if (/^\d{10}$/.test(id)) {
            return this.loginStudent(id, password);
        }

        return this.loginStaff(id, password);
    }

    createSession(res: Response, data: unknown): void {
        res.cookie(this.sessionCookieName, this.encryptSession(data), {
            httpOnly: true,
            secure: this.isProduction,
            sameSite: "strict",
            signed: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
    }

    clearSession(res: Response): void {
        res.clearCookie(this.sessionCookieName, {
            httpOnly: true,
            secure: this.isProduction,
            sameSite: "strict",
            signed: true,
        });
    }

    verifySession(
        ...allowedRoles: UserRole[]
    ): RequestHandler<unknown, { error: string }> {
        return (req, res, next) => {
            const token = (
                req.signedCookies as Record<string, string | undefined>
            )[this.sessionCookieName];

            if (!token) {
                res.status(401).json({ error: req.t("http.unauthorized") });
                return;
            }

            try {
                const data = this.decryptSession(token);

                req.sessionData = data;

                if (
                    allowedRoles.length > 0 &&
                    !allowedRoles.includes(data.role)
                ) {
                    res.status(403).json({ error: req.t("http.forbidden") });
                    return;
                }

                next();
            } catch {
                res.status(401).json({ error: req.t("auth.sessionExpired") });
            }
        };
    }

    /**
     * Encrypts a session using AES-256-GCM encryption.
     *
     * @param data The session data.
     * @returns The session token.
     */
    private encryptSession(data: unknown): string {
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

    /**
     * Decrypts an AES-256-GCM encrypted session token.
     *
     * @param token The session token.
     * @returns The session data.
     */
    private decryptSession(token: string): SessionData {
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

        return JSON.parse(decrypted.toString("utf8")) as SessionData;
    }

    private async loginStudent(
        nisn: string,
        password: string,
    ): Promise<LoginResult> {
        const studentLoginData =
            await this.studentRepository.getLoginData(nisn);

        if (!studentLoginData) {
            throw new UnauthorizedError("auth.invalidCredentials");
        }

        await this.validateCredentials(studentLoginData.user, password);

        return studentLoginData;
    }

    private async loginStaff(
        id: string,
        password: string,
    ): Promise<LoginResult> {
        if (/^[1-9]\d$/.test(id)) {
            throw new UnauthorizedError("auth.invalidStaffId");
        }

        const staffId = parseInt(id, 10);

        // Attempt teacher login first in case of ID conflicts with administrator.
        const teacherLoginData =
            await this.teacherRepository.getLoginData(staffId);

        if (teacherLoginData) {
            await this.validateCredentials(teacherLoginData.user, password);

            return teacherLoginData;
        }

        const administratorLoginData =
            await this.administratorRepository.getLoginData(staffId);

        if (!administratorLoginData) {
            throw new UnauthorizedError("auth.invalidCredentials");
        }

        await this.validateCredentials(administratorLoginData.user, password);

        return administratorLoginData;
    }

    private async validateCredentials(user: User, password: string) {
        if (!user.active) {
            throw new ForbiddenError(
                user.role === UserRole.administrator
                    ? "auth.inactiveAdminAccount"
                    : "auth.inactiveUserAccount",
            );
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError("auth.invalidCredentials");
        }
    }
}
