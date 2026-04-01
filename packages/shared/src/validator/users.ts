import { createInsertSchema } from "drizzle-zod";
import { users } from "../database/schema";

/**
 * The Zod schema for validating user insertion data.
 */
export const insertUserSchema = createInsertSchema(users, {
    name: (schema) =>
        schema
            .min(1, "Name is required")
            .max(100, "Name must be at most 100 characters long"),
    password: (schema) =>
        schema
            .min(1, "Password is required")
            .max(72, "Password must be at most 72 characters long"),
});

/**
 * The Regex pattern for validating passwords.
 *
 * Passwords must be at least 8 characters long with 1 capital letter, 1 lowercase letter, 1 number, and 1 symbol.
 */
export const passwordRegex =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/;
