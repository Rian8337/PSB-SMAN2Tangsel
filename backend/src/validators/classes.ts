import { MessageKey } from "@/i18n";
import z from "zod";

const idError = {
    error: "classSubject.invalidClassSubjectId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a class subject ID.
 */
export const classSubjectIdSchema = z
    .number(idError)
    .int(idError)
    .positive(idError);
