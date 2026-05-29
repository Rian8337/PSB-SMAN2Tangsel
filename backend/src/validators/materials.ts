import { MessageKey } from "@/i18n";
import z from "zod";

const materialIdError = {
    error: "material.invalidId" satisfies MessageKey,
};

const materialTitleError = {
    error: "material.invalidTitle" satisfies MessageKey,
};

const materialClassSubjectIdError = {
    error: "material.invalidClassSubjectId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a material ID.
 */
export const materialIdSchema = z
    .number(materialIdError)
    .int(materialIdError)
    .positive(materialIdError);

/**
 * A Zod schema for validating a material ID that may be provided as a string and coerced to a number.
 */
export const coercedMaterialIdSchema = z.coerce
    .number(materialIdError)
    .pipe(materialIdSchema);

/**
 * A Zod schema for validating the body of a create material request.
 * Multipart fields are always strings, so coercion and string-to-boolean transforms are applied.
 */
export const createMaterialBodySchema = z.object({
    classSubjectId: z.coerce
        .number(materialClassSubjectIdError)
        .int(materialClassSubjectIdError)
        .positive(materialClassSubjectIdError),
    title: z.string(materialTitleError).min(1, materialTitleError).max(255, materialTitleError),
    description: z
        .string()
        .max(2000)
        .nullable()
        .optional()
        .transform((v) => v ?? null),
    visible: z
        .union([z.boolean(), z.string().transform((v) => v === "true")])
        .default(false),
});

/**
 * A Zod schema for validating the body of an update material request.
 * Arrays are sent as JSON strings from the frontend and parsed here.
 */
export const updateMaterialBodySchema = z.object({
    title: z.string(materialTitleError).min(1, materialTitleError).max(255, materialTitleError),
    description: z
        .string()
        .max(2000)
        .nullable()
        .optional()
        .transform((v) => v ?? null),
    visible: z
        .union([z.boolean(), z.string().transform((v) => v === "true")])
        .default(false),
    deletedAttachmentIds: z
        .preprocess(
            (val) => (typeof val === "string" ? (JSON.parse(val) as unknown) : val),
            z.array(z.number().int().positive()).default([]),
        ),
    renamedAttachments: z
        .preprocess(
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
