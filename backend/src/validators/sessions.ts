import { validSemesterSchema, validSessionSchema } from "@psb/shared/validator";
import z from "zod";

/**
 * Optional session query field — a URL-decoded string like "2024/2025".
 */
export const optionalSessionField = validSessionSchema.optional();

/**
 * Optional semester query field — a numeric string "1" or "2".
 */
export const optionalSemesterField = z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : undefined))
    .pipe(validSemesterSchema.optional());
