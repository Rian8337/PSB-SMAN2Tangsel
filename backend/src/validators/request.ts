import { MessageKey } from "@/i18n";
import z from "zod";

/**
 * A Zod schema for validating the query parameter of a search request.
 */
export const querySchema = z
    .string({ error: "controller.invalidQueryFormat" satisfies MessageKey })
    .optional()
    .transform((val) => (val ? decodeURIComponent(val) : undefined));

/**
 * A Zod schema for validating the limit query parameter of a list request.
 */
export const limitSchema = z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .superRefine((val, ctx) => {
        if (val === undefined) {
            return;
        }

        if (Number.isNaN(val)) {
            ctx.addIssue({
                code: "custom",
                message: "controller.invalidLimitFormat" satisfies MessageKey,
            });
        } else if (val <= 0 || val > 50) {
            ctx.addIssue({
                code: "custom",
                message: "controller.invalidLimitRange" satisfies MessageKey,
            });
        }
    });

/**
 * A Zod schema for validating the offset query parameter of a list request.
 */
export const offsetSchema = z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .superRefine((val, ctx) => {
        if (val === undefined) {
            return;
        }

        if (Number.isNaN(val)) {
            ctx.addIssue({
                code: "custom",
                message: "controller.invalidOffsetFormat" satisfies MessageKey,
            });
        } else if (val < 0) {
            ctx.addIssue({
                code: "custom",
                message: "controller.invalidOffsetRange" satisfies MessageKey,
            });
        }
    });

/**
 * A Zod schema for validating query parameters of a list request.
 */
export const listQuerySchema = z.object({
    query: querySchema,
    limit: limitSchema,
    offset: offsetSchema,
});
