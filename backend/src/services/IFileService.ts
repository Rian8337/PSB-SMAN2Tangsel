/**
 * A single file entry to be added to a ZIP archive.
 */
export interface ZipEntry {
    /**
     * The folder name within the ZIP archive to place the file in.
     */
    readonly folder: string;

    /**
     * The filename of the file within its folder.
     */
    readonly filename: string;

    /**
     * The path to the file, relative to the storage root.
     */
    readonly path: string;
}

/**
 * Provides operations for working with files.
 */
export interface IFileService {
    /**
     * Creates a ZIP archive from the given file entries.
     *
     * @param entries The file entries to include in the archive.
     * @returns A Buffer containing the ZIP archive.
     */
    createZipArchive(entries: readonly ZipEntry[]): Promise<Buffer>;
}
