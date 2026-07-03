/**
 * A single attachment record as stored in the database.
 */
export interface AttachmentRecord {
    readonly id: number;
    readonly name: string;
    readonly path: string;
}

/**
 * Defines operations for accessing attachment data in the database.
 */
export interface IAttachmentRepository {
    /**
     * Creates a new attachment record in the database.
     *
     * @param name The original display name of the file.
     * @param path The storage path relative to the storage root.
     * @returns The created attachment record.
     */
    create(name: string, path: string): Promise<AttachmentRecord>;

    /**
     * Returns the attachment records for the given IDs.
     *
     * @param ids The attachment IDs to look up.
     * @returns The matching attachment records.
     */
    getByIds(ids: number[]): Promise<AttachmentRecord[]>;

    /**
     * Updates the display name and storage path of an attachment.
     *
     * @param id The attachment ID.
     * @param newName The new display name.
     * @param newPath The new storage path relative to the storage root.
     */
    updateNameAndPath(
        id: number,
        newName: string,
        newPath: string,
    ): Promise<void>;

    /**
     * Deletes attachment records by their IDs.
     *
     * @param ids The attachment IDs to delete.
     */
    deleteByIds(ids: number[]): Promise<void>;
}
