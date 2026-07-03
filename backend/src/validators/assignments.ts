import { MessageKey } from "@/i18n";
import z from "zod";

const assignmentIdError = {
    error: "assignment.invalidId" satisfies MessageKey,
};

const assignmentTitleError = {
    error: "assignment.invalidTitle" satisfies MessageKey,
};

const assignmentClassSubjectIdError = {
    error: "assignment.invalidClassSubjectId" satisfies MessageKey,
};

const assignmentDueAtError = {
    error: "assignment.invalidDueAt" satisfies MessageKey,
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

const dueAtSchema = z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.union([
        z.null(),
        z
            .string()
            .refine((v) => !isNaN(new Date(v).getTime()), assignmentDueAtError)
            .transform((v) => new Date(v)),
    ]),
);

/**
 * A Zod schema for validating the body of a create assignment request.
 * Multipart fields are always strings, so coercion and string-to-boolean transforms are applied.
 */
export const createAssignmentBodySchema = z.object({
    classSubjectId: z.coerce
        .number(assignmentClassSubjectIdError)
        .int(assignmentClassSubjectIdError)
        .positive(assignmentClassSubjectIdError),
    title: z
        .string(assignmentTitleError)
        .min(1, assignmentTitleError)
        .max(255, assignmentTitleError),
    description: z
        .string()
        .max(2000)
        .nullable()
        .optional()
        .transform((v) => v ?? null),
    dueAt: dueAtSchema,
    visible: z
        .union([z.boolean(), z.string().transform((v) => v === "true")])
        .default(false),
});

/**
 * A Zod schema for validating the body of an update assignment request.
 * Arrays are sent as JSON strings from the frontend and parsed here.
 */
export const updateAssignmentBodySchema = z.object({
    title: z
        .string(assignmentTitleError)
        .min(1, assignmentTitleError)
        .max(255, assignmentTitleError),
    description: z
        .string()
        .max(2000)
        .nullable()
        .optional()
        .transform((v) => v ?? null),
    dueAt: dueAtSchema,
    visible: z
        .union([z.boolean(), z.string().transform((v) => v === "true")])
        .default(false),
    deletedAttachmentIds: z.preprocess(
        (val) => (typeof val === "string" ? (JSON.parse(val) as unknown) : val),
        z.array(z.number().int().positive()).default([]),
    ),
    renamedAttachments: z.preprocess(
        (val) => (typeof val === "string" ? (JSON.parse(val) as unknown) : val),
        z
            .array(
                z.object({
                    id: z.number().int().positive(),
                    newName: z.string().min(1),
                }),
            )
            .default([]),
    ),
});
