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
