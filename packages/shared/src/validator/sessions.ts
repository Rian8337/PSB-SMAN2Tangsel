import z from "zod";
import { ValidSession } from "../types";

/**
 * Zod schema for validating valid sessions in the format "YYYY/YYYY".
 */
export const validSessionSchema = z
    .string()
    .length(9, "Session must be in the format YYYY/YYYY")
    .regex(/^\d{4}\/\d{4}$/, "Session must be in the format YYYY/YYYY")
    .refine((session) => {
        const [startYear, endYear] = session.split("/").map(Number);

        return endYear === startYear + 1;
    }, "End year must be exactly one year after start year")
    .transform((session) => session as ValidSession);

/**
 * Zod schema for validating valid semesters (1 or 2).
 */
export const validSemesterSchema = z.union([z.literal(1), z.literal(2)]);

/**
 * Zod schema for validating `AcademicSessionDTO`s.
 */
export const academicSessionDtoSchema = z.object({
    session: validSessionSchema,
    semester: validSemesterSchema,
    active: z.boolean(),
    startTime: z
        .number()
        .transform((val) => new Date(val))
        .refine((d) => !Number.isNaN(d.getTime()), "Invalid start time"),
    endTime: z
        .number()
        .transform((val) => new Date(val))
        .refine((d) => !Number.isNaN(d.getTime()), "Invalid end time"),
});
