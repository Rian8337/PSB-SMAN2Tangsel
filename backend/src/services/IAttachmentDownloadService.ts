/**
 * A service that is responsible for recording attachment download events.
 */
export interface IAttachmentDownloadService {
    /**
     * Records a download of an attachment by a user.
     *
     * @param attachmentId The ID of the downloaded attachment.
     * @param userId The ID of the user who downloaded it.
     */
    recordDownload(attachmentId: number, userId: number): Promise<void>;
}
