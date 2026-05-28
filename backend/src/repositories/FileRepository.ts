import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IConfigService } from "@/services/IConfigService";
import { EnvironmentVariableKey } from "@/types";
import { readFile } from "fs/promises";
import { join } from "path";
import { inject } from "tsyringe";
import { IFileRepository } from "./IFileRepository";

/**
 * Provides file read operations backed by the local filesystem storage.
 */
@Injectable(dependencyTokens.fileRepository)
export class FileRepository implements IFileRepository {
    constructor(
        @inject(dependencyTokens.configService)
        private readonly configService: IConfigService,
    ) {}

    async read(relativePath: string): Promise<Buffer> {
        const storagePath = this.configService.getEnvironmentVariable(
            EnvironmentVariableKey.storagePath,
            true,
        );

        return readFile(join(storagePath, relativePath));
    }
}
