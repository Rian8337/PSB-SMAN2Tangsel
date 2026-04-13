import { MessageKey } from "@/i18n";
import z from "zod";

const idError = {
    error: "subject.invalidId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a subject ID.
 */
export const subjectIdSchema = z.number(idError).int(idError).positive(idError);

/**
 * A Zod schema for validating a subject ID that may be provided as a string and coerced to a number.
 */
export const coercedSubjectIdSchema = z.coerce
    .number(idError)
    .pipe(subjectIdSchema);
