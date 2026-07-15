import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { attachmentDownloads } from "@psb/shared/schema";
import { DrizzleDb } from "@psb/shared/types";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IAttachmentDownloadRepository } from "./IAttachmentDownloadRepository";

/**
 * Defines operations for recording attachment download events.
 */
@Injectable(dependencyTokens.attachmentDownloadRepository)
export class AttachmentDownloadRepository
    extends DatabaseRepository
    implements IAttachmentDownloadRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async record(attachmentId: number, userId: number) {
        await this.db
            .insert(attachmentDownloads)
            .values({ attachmentId, userId });
    }
}
