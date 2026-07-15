import { attachmentDownloads } from "@psb/shared/schema";
import { DrizzleDb } from "@psb/shared/types";
import { count, inArray } from "drizzle-orm";

/**
 * Returns a map of attachment ID to its total download count, for a given set of attachment IDs.
 * Attachment IDs with zero downloads are simply absent from the returned map (callers should treat a
 * missing entry as a count of 0).
 *
 * Used directly by {@link MaterialRepository} and {@link AssignmentRepository} when assembling
 * attachment lists. This is not exposed through a service, since aggregating a count alongside attachment
 * metadata that those repositories already fetch directly is consistent with how they already query
 * multiple schema tables without cross-repository indirection.
 *
 * @param db The database instance to query.
 * @param attachmentIds The attachment IDs to fetch counts for.
 */
export async function getDownloadCounts(
    db: DrizzleDb,
    attachmentIds: number[],
): Promise<Map<number, number>> {
    if (attachmentIds.length === 0) {
        return new Map();
    }

    const rows = await db
        .select({
            attachmentId: attachmentDownloads.attachmentId,
            count: count(),
        })
        .from(attachmentDownloads)
        .where(inArray(attachmentDownloads.attachmentId, attachmentIds))
        .groupBy(attachmentDownloads.attachmentId);

    return new Map(rows.map((row) => [row.attachmentId, row.count]));
}
