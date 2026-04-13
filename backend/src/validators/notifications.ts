import { MessageKey } from "@/i18n";
import z from "zod";

const idError = {
    error: "notification.invalidId" satisfies MessageKey,
};

/**
 * A Zod schema for validating a notification ID.
 */
export const notificationIdSchema = z
    .number(idError)
    .int(idError)
    .positive(idError);
