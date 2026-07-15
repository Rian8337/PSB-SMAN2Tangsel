import { attachmentDownloads, attachments } from "../database/schema";

/**
 * The type of an attachment as stored in the database.
 */
export type Attachment = typeof attachments.$inferSelect;

/**
 * The type of an attachment download log entry as stored in the database.
 */
export type AttachmentDownload = typeof attachmentDownloads.$inferSelect;
