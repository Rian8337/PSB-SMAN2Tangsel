import { subjects } from "../database/schema";

/**
 * The type of a subject as stored in the database.
 */
export type Subject = typeof subjects.$inferSelect;
