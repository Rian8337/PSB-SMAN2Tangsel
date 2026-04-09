import { classes } from "../database/schema";

/**
 * The type of a class as stored in the database.
 */
export type Class = typeof classes.$inferSelect;
