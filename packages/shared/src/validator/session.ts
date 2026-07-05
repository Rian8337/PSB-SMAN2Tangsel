import { UserRole } from "@psb/shared/types";
import z from "zod";

/**
 * A validator for session data of a student session.
 */
export const studentSessionDataValidator = z.object({
    userId: z.number().int().min(1),
    role: z.literal(UserRole.Student),
    identifier: z.string().length(10),
    classId: z.number().int().min(1).optional(),
});

/**
 * A validator for session data of a teacher session.
 */
export const teacherSessionDataValidator = z.object({
    userId: z.number().int().min(1),
    role: z.literal(UserRole.Teacher),
    identifier: z.string().min(1),
});

/**
 * A validator for session data of an administrator session.
 */
export const administratorSessionDataValidator = z.object({
    userId: z.number().int().min(1),
    role: z.literal(UserRole.Administrator),
    identifier: z.string().min(1),
});

/**
 * A validator for all session data, discriminated by the `role` field.
 */
export const sessionDataValidator = z.discriminatedUnion("role", [
    studentSessionDataValidator,
    teacherSessionDataValidator,
    administratorSessionDataValidator,
]);
