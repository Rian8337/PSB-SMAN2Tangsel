import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { classes } from "../database/schema";
import { validSemesterSchema, validSessionSchema } from "./sessions";

/**
 * A Zod schema for validating class names.
 */
export const validClassNameSchema = z
    .string()
    .min(1, "Class name is required")
    .max(50, "Class name must be at most 50 characters long");

/**
 * A Zod schema for validating class insertion data.
 */
export const insertClassSchema = createInsertSchema(classes, {
    name: validClassNameSchema,
    semester: validSemesterSchema,
    session: validSessionSchema,
}).omit({ id: true });
