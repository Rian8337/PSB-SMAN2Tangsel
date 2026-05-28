import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IFileRepository } from "@/repositories";
import JSZip from "jszip";
import { inject } from "tsyringe";
import { IFileService, ZipEntry } from "./IFileService";

/**
 * A service responsible for file operations such as creating ZIP archives.
 */
@Injectable(dependencyTokens.fileService)
export class FileService implements IFileService {
    constructor(
        @inject(dependencyTokens.fileRepository)
        private readonly fileRepository: IFileRepository,
    ) {}

    async createZipArchive(entries: readonly ZipEntry[]): Promise<Buffer> {
        const zip = new JSZip();

        await Promise.all(
            entries.map(async ({ folder, filename, path }) => {
                const content = await this.fileRepository.read(path);

                zip.folder(folder)!.file(filename, content);
            }),
        );

        return zip.generateAsync({ type: "nodebuffer" });
    }
}
