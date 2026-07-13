import { limitSchema, offsetSchema } from "./request";
import { validSemesterSchema, validSessionSchema } from "@psb/shared/validator";
import z from "zod";

/**
 * A Zod schema for validating the semester query field of a bookmark list request, coerced from a string.
 */
const semesterField = z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(validSemesterSchema);

/**
 * A Zod schema for validating query parameters of a "my bookmarks" list request.
 */
export const bookmarkListQuerySchema = z.object({
    session: validSessionSchema,
    semester: semesterField,
    limit: limitSchema,
    offset: offsetSchema,
});
