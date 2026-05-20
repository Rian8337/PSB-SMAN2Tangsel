import { materials } from "../database/schema";

/**
 * The type of a material as stored in the database.
 */
export type Material = typeof materials.$inferSelect;
