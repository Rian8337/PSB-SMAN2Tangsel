import { MessageKey } from "@/i18n";
import z from "zod";

const assignmentIdError = {
    error: "assignment.invalidId" satisfies MessageKey,
};

/**
 * A Zod schema for validating an assignment ID.
 */
export const assignmentIdSchema = z
    .number(assignmentIdError)
    .int(assignmentIdError)
    .positive(assignmentIdError);

/**
 * A Zod schema for validating an assignment ID that may be provided as a string and coerced to a
 * number.
 */
export const coercedAssignmentIdSchema = z.coerce
    .number(assignmentIdError)
    .pipe(assignmentIdSchema);
