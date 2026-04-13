import { MessageKey } from "@/i18n";
import z from "zod";

/**
 * A Zod schema for validating query parameters of a list request.
 */
export const listQuerySchema = z.object({
    query: z
        .string({ error: "controller.invalidQueryFormat" satisfies MessageKey })
        .optional()
        .transform((val) => (val ? decodeURIComponent(val) : undefined)),

    limit: z
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
                    message:
                        "controller.invalidLimitFormat" satisfies MessageKey,
                });
            } else if (val <= 0 || val > 50) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "controller.invalidLimitRange" satisfies MessageKey,
                });
            }
        }),

    offset: z
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
                    message:
                        "controller.invalidOffsetFormat" satisfies MessageKey,
                });
            } else if (val < 0) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "controller.invalidOffsetRange" satisfies MessageKey,
                });
            }
        }),
});
