import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAttachmentRepository } from "@/repositories";
import { IFileRepository } from "@/repositories/IFileRepository";
import { randomUUID } from "crypto";
import { extname } from "path";
import { inject } from "tsyringe";
import {
    IAttachmentService,
    SavedAttachment,
    TempFile,
} from "./IAttachmentService";

/**
 * Manages attachment files on disk and their corresponding database records.
 */
@Injectable(dependencyTokens.attachmentService)
export class AttachmentService implements IAttachmentService {
    constructor(
        @inject(dependencyTokens.fileRepository)
        private readonly fileRepository: IFileRepository,
        @inject(dependencyTokens.attachmentRepository)
        private readonly attachmentRepository: IAttachmentRepository,
    ) {}

    async saveFile(file: TempFile): Promise<SavedAttachment> {
        const ext = extname(file.originalFilename);
        const destRelativePath = `attachments/${randomUUID()}${ext}`;

        await this.fileRepository.saveFile(file.path, destRelativePath);

        const record = await this.attachmentRepository.create(
            file.originalFilename,
            destRelativePath,
        );

        return { id: record.id, name: record.name };
    }

    async delete(ids: number[]): Promise<void> {
        if (ids.length === 0) {
            return;
        }

        const records = await this.attachmentRepository.getByIds(ids);

        await Promise.all(
            records.map((r) => this.fileRepository.deleteFile(r.path)),
        );

        await this.attachmentRepository.deleteByIds(ids);
    }

    async updateRenameAttachments(
        renames: { id: number; newName: string }[],
    ): Promise<void> {
        if (renames.length === 0) {
            return;
        }

        const records = await this.attachmentRepository.getByIds(
            renames.map((r) => r.id),
        );

        for (const rename of renames) {
            const existing = records.find((r) => r.id === rename.id);

            if (!existing) {
                continue;
            }

            const ext = extname(existing.path);
            const newPath = `attachments/${randomUUID()}${ext}`;

            await this.fileRepository.rename(existing.path, newPath);

            await this.attachmentRepository.updateNameAndPath(
                rename.id,
                rename.newName,
                newPath,
            );
        }
    }
}
