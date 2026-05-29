/**
 * A temporary file created by the form upload middleware.
 */
export interface TempFile {
    /**
     * Absolute path to the temporary file on disk.
     */
    readonly path: string;

    /**
     * Original filename as provided by the uploader.
     */
    readonly originalFilename: string;
}

/**
 * A file that has been saved to storage and recorded in the database.
 */
export interface SavedAttachment {
    readonly id: number;
    readonly name: string;
}

/**
 * Provides operations for managing attachment files and their database records.
 */
export interface IAttachmentService {
    /**
     * Saves a temporary upload file to permanent storage and creates a database record.
     *
     * @param file The temporary file to save.
     * @returns The saved attachment with its assigned ID and display name.
     */
    saveFile(file: TempFile): Promise<SavedAttachment>;

    /**
     * Deletes attachment files from storage and removes their database records.
     * No-op if the IDs array is empty.
     *
     * @param ids The IDs of the attachments to delete.
     */
    delete(ids: number[]): Promise<void>;

    /**
     * Renames attachments in both storage and the database.
     * No-op if the renames array is empty.
     *
     * @param renames An array of `{ id, newName }` pairs.
     */
    updateRenameAttachments(
        renames: { id: number; newName: string }[],
    ): Promise<void>;
}
