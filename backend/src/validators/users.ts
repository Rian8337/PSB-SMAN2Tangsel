import { MessageKey } from "@/i18n";
import { UserRole } from "@psb/shared/types";
import z from "zod";

const idError = {
    error: "user.invalidId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a user ID.
 */
export const userIdSchema = z.number(idError).int(idError).positive(idError);

/**
 * A Zod schema for validating a user ID that may be provided as a string and coerced to a number.
 */
export const coercedUserIdSchema = z.coerce.number(idError).pipe(userIdSchema);

/**
 * A Zod schema for validating user names.
 */
export const validNameSchema = z
    .string({
        error: "user.invalidName" satisfies MessageKey,
    })
    .min(1, {
        error: "user.invalidName" satisfies MessageKey,
    });

/**
 * A Zod schema for validating passwords.
 */
export const validPasswordSchema = z
    .string({
        error: "user.invalidPassword" satisfies MessageKey,
    })
    .min(1, {
        error: "user.invalidPassword" satisfies MessageKey,
    });

/**
 * The Zod schema for validating user roles.
 */
export const validRoleSchema = z.enum(UserRole, {
    error: "user.invalidRole" satisfies MessageKey,
});

/**
 * A Zod schema for validating user identifiers.
 */
export const validIdentifierSchema = z
    .string({
        error: "user.invalidIdentifier" satisfies MessageKey,
    })
    .min(1, {
        error: "user.invalidIdentifier" satisfies MessageKey,
    });

/**
 * A Zod schema for validating the request body of a create user request.
 */
export const createUserSchema = z.object({
    name: validNameSchema,
    password: validPasswordSchema,
    role: validRoleSchema,
    identifier: validIdentifierSchema,
});
