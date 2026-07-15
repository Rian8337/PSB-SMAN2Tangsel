import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAttachmentDownloadRepository } from "@/repositories";
import { inject } from "tsyringe";
import { IAttachmentDownloadService } from "./IAttachmentDownloadService";

/**
 * A service that is responsible for recording attachment download events.
 */
@Injectable(dependencyTokens.attachmentDownloadService)
export class AttachmentDownloadService implements IAttachmentDownloadService {
    constructor(
        @inject(dependencyTokens.attachmentDownloadRepository)
        private readonly attachmentDownloadRepository: IAttachmentDownloadRepository,
    ) {}

    recordDownload(attachmentId: number, userId: number) {
        return this.attachmentDownloadRepository.record(attachmentId, userId);
    }
}
