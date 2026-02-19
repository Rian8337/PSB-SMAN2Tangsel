import { createInsertSchema } from "drizzle-zod";
import { users } from "../schema";

/**
 * The Zod schema for validating user insertion data.
 */
export const insertUserSchema = createInsertSchema(users, {
    name: (schema) => schema.min(1, "Name is required"),
    password: (schema) =>
        schema
            .min(1, "Password is required")
            .max(72, "Password must be at most 72 characters long"),
});
