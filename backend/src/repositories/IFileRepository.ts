/**
 * Provides operations for reading and writing files from storage.
 */
export interface IFileRepository {
    /**
     * Reads a file from storage and returns its contents as a Buffer.
     *
     * @param relativePath The path to the file, relative to the storage root.
     * @returns The contents of the file as a Buffer.
     */
    read(relativePath: string): Promise<Buffer>;

    /**
     * Copies a file from a temporary source path to the storage directory.
     *
     * @param sourcePath The absolute path to the source file (e.g. temp file from form upload).
     * @param destRelativePath The destination path relative to the storage root.
     */
    saveFile(sourcePath: string, destRelativePath: string): Promise<void>;

    /**
     * Renames (moves) a file within the storage directory.
     *
     * @param oldRelativePath The current path relative to the storage root.
     * @param newRelativePath The new path relative to the storage root.
     */
    rename(oldRelativePath: string, newRelativePath: string): Promise<void>;

    /**
     * Deletes a file from the storage directory. Silently ignores missing files.
     *
     * @param relativePath The path to the file, relative to the storage root.
     */
    deleteFile(relativePath: string): Promise<void>;
}
