import { assignments } from "../database/schema";

/**
 * The type of an assignment as stored in the database.
 */
export type Assignment = typeof assignments.$inferSelect;
