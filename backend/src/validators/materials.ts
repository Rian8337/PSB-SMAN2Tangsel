import { MessageKey } from "@/i18n";
import z from "zod";

const materialIdError = {
    error: "material.invalidId" satisfies MessageKey,
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
