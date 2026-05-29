import { MessageKey } from "@/i18n";
import z from "zod";

const submissionIdError = {
    error: "submission.invalidId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a submission ID.
 */
export const submissionIdSchema = z
    .number(submissionIdError)
    .int(submissionIdError)
    .positive(submissionIdError);

/**
 * A Zod schema for validating a submission ID that may be provided as a string and coerced to a
 * number.
 */
export const coercedSubmissionIdSchema = z.coerce
    .number(submissionIdError)
    .pipe(submissionIdSchema);

/**
 * A Zod schema for validating the body of an update submission request.
 * Arrays are sent as JSON strings from the frontend and parsed here.
 */
export const updateSubmissionBodySchema = z.object({
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
