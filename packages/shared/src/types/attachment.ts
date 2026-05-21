import { attachments } from "../database/schema";

/**
 * The type of an attachment as stored in the database.
 */
export type Attachment = typeof attachments.$inferSelect;
