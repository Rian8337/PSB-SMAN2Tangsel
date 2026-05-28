/**
 * Provides operations for reading files from storage.
 */
export interface IFileRepository {
    /**
     * Reads a file from storage and returns its contents as a Buffer.
     *
     * @param relativePath The path to the file, relative to the storage root.
     * @returns The contents of the file as a Buffer.
     */
    read(relativePath: string): Promise<Buffer>;
}
