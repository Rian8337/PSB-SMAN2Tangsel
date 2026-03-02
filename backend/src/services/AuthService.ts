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

    async login(id: string, password: string): Promise<User> {
        if (/^\d{10}$/.test(id)) {
            return this.loginStudent(id, password);
        }

        return this.loginStaff(id, password);
    }

    createSession(res: Response, data: unknown): void {
        const plaintext = JSON.stringify(data);
        const iv = randomBytes(this.ivLength);
        const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext, "utf8"),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        // Format: base64url(iv + authTag + ciphertext)
        const token = Buffer.concat([iv, authTag, encrypted]).toString(
            "base64url",
        );

        res.cookie(this.sessionCookieName, token, {
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
                res.status(401).json({ error: "Not authenticated." });
                return;
            }

            try {
                const data = this.decryptSession(token);

                req.sessionData = data;

                if (
                    allowedRoles.length > 0 &&
                    !allowedRoles.includes(data.role)
                ) {
                    res.status(403).json({ error: "Forbidden." });
                    return;
                }

                next();
            } catch {
                res.status(401).json({ error: "Invalid session." });
            }
        };
    }

    /**
     * Decrypts an AES-256-GCM encrypted session token.
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

    private async loginStudent(nisn: string, password: string): Promise<User> {
        const student = await this.studentRepository.findByNISN(nisn);

        if (!student) {
            throw new UnauthorizedError("Invalid credentials.");
        }

        await this.validateCredentials(student, password);

        return student;
    }

    private async loginStaff(id: string, password: string): Promise<User> {
        if (/^[1-9]\d$/.test(id)) {
            throw new UnauthorizedError("Invalid staff ID.");
        }

        const staffId = parseInt(id, 10);

        // Attempt teacher login first in case of ID conflicts with administrator.
        const teacher = await this.teacherRepository.findByStaffId(staffId);

        if (teacher) {
            await this.validateCredentials(teacher, password);

            return teacher;
        }

        const administrator =
            await this.administratorRepository.findByStaffId(staffId);

        if (!administrator) {
            throw new UnauthorizedError("Invalid credentials.");
        }

        await this.validateCredentials(administrator, password, true);

        return administrator;
    }

    private async validateCredentials(
        user: User,
        password: string,
        isAdministrator = false,
    ) {
        if (!user.active) {
            const message = isAdministrator
                ? "Your administrator account is inactive. Please contact another administrator."
                : "Your account is inactive. Please contact an administrator.";

            throw new ForbiddenError(message);
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid credentials.");
        }
    }
}
