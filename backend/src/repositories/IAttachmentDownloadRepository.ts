/**
 * Defines operations for recording attachment download events.
 */
export interface IAttachmentDownloadRepository {
    /**
     * Records a single download event for an attachment.
     *
     * @param attachmentId The ID of the downloaded attachment.
     * @param userId The ID of the user who downloaded it.
     */
    record(attachmentId: number, userId: number): Promise<void>;
}
