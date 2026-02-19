import {
    boolean,
    mysqlTable,
    serial,
    text,
    varchar,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

/**
 * Base table for all users.
 */
export const users = mysqlTable("user", {
    /**
     * Whether the user is considered active. Inactive users cannot authenticate to the system.
     */
    active: boolean().notNull().default(true),

    /**
     * The system-issued identification number of the user.
     */
    id: serial().primaryKey(),

    /**
     * The name of the user.
     */
    name: text().notNull(),

    /**
     * The encrypted password of the user. The maximum length is 72 characters, which is the maximum length of a bcrypt hash.
     */
    password: varchar({ length: 72 }).notNull(),
});
