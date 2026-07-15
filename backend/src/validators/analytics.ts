import { limitSchema } from "./request";
import { validSemesterSchema, validSessionSchema } from "@psb/shared/validator";
import z from "zod";

/**
 * A Zod schema for validating the semester query field of a download analytics request, coerced from a string.
 */
const semesterField = z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(validSemesterSchema);

/**
 * A Zod schema for validating query parameters of a download analytics request.
 */
export const analyticsQuerySchema = z.object({
    session: validSessionSchema,
    semester: semesterField,
    limit: limitSchema,
});
