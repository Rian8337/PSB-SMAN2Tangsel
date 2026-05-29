import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IConfigService } from "@/services/IConfigService";
import { EnvironmentVariableKey } from "@/types";
import { copyFile, mkdir, readFile, rename, unlink } from "fs/promises";
import { dirname, join } from "path";
import { inject } from "tsyringe";
import { IFileRepository } from "./IFileRepository";

/**
 * Provides file read operations backed by the local filesystem storage.
 */
@Injectable(dependencyTokens.fileRepository)
export class FileRepository implements IFileRepository {
    private readonly storagePath: string;

    constructor(
        @inject(dependencyTokens.configService)
        configService: IConfigService,
    ) {
        this.storagePath = configService.getEnvironmentVariable(
            EnvironmentVariableKey.storagePath,
            true,
        );
    }

    async read(relativePath: string): Promise<Buffer> {
        return readFile(join(this.storagePath, relativePath));
    }

    async saveFile(
        sourcePath: string,
        destRelativePath: string,
    ): Promise<void> {
        const dest = join(this.storagePath, destRelativePath);

        await mkdir(dirname(dest), { recursive: true });
        await copyFile(sourcePath, dest);
    }

    async rename(
        oldRelativePath: string,
        newRelativePath: string,
    ): Promise<void> {
        const { storagePath } = this;

        await rename(
            join(storagePath, oldRelativePath),
            join(storagePath, newRelativePath),
        );
    }

    async deleteFile(relativePath: string): Promise<void> {
        try {
            await unlink(join(this.storagePath, relativePath));
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
                throw e;
            }
        }
    }
}
