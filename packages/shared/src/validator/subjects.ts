import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { subjects } from "../database/schema";

/**
 * The Zod schema for validating subject insertion data.
 */
export const insertSubjectSchema = createInsertSchema(subjects, {
    code: z
        .string()
        .min(1, "Subject code is required")
        .max(15, "Subject code must be at most 15 characters long")
        .regex(
            /^[A-Z0-9-]+$/,
            "Subject code must only contain uppercase letters, numbers, and hyphens",
        ),

    name: z
        .string()
        .min(1, "Subject name is required")
        .max(50, "Subject name must be at most 50 characters long"),

    active: z.boolean().optional(),
}).omit({ id: true });
