import { AttachmentDownloadService } from "@/services/AttachmentDownloadService";
import { mockAttachmentDownloadRepository } from "@test/mocks";

const service = new AttachmentDownloadService(mockAttachmentDownloadRepository);

describe("recordDownload", () => {
    it("should delegate to the repository", async () => {
        await service.recordDownload(1, 3);

        expect(mockAttachmentDownloadRepository.record).toHaveBeenCalledWith(
            1,
            3,
        );
    });
});
