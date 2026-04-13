import { MessageKey } from "@/i18n";
import z from "zod";

const classIdError = {
    error: "class.invalidId" satisfies MessageKey,
};

const classSubjectIdError = {
    error: "classSubject.invalidId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a class ID.
 */
export const classIdSchema = z
    .number(classIdError)
    .int(classIdError)
    .positive(classIdError);

/**
 * A Zod schema for validating a class ID that may be provided as a string and coerced to a number.
 */
export const coercedClassIdSchema = z.coerce
    .number(classIdError)
    .pipe(classIdSchema);

/**
 * A Zod schema for validating a class subject ID.
 */
export const classSubjectIdSchema = z
    .number(classSubjectIdError)
    .int(classSubjectIdError)
    .positive(classSubjectIdError);

/**
 * A Zod schema for validating a class subject ID that may be provided as a string and coerced to a number.
 */
export const coercedClassSubjectIdSchema = z.coerce
    .number(classSubjectIdError)
    .pipe(classSubjectIdSchema);
