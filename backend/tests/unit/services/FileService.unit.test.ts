import { FileService } from "@/services/FileService";
import JSZip from "jszip";
import { mockFileRepository } from "@test/mocks";

describe("FileService (unit)", () => {
    const service = new FileService(mockFileRepository);

    describe("createZipArchive", () => {
        it("should return a valid Buffer for an empty entry list", async () => {
            const result = await service.createZipArchive([]);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(0);
        });

        it("should call fileRepository.read for each entry and include the file in the correct folder", async () => {
            const fileContent = Buffer.from("hello world");

            mockFileRepository.read.mockResolvedValue(fileContent);

            const result = await service.createZipArchive([
                {
                    folder: "Alice_001",
                    filename: "hw.pdf",
                    path: "attachments/hw.pdf",
                },
            ]);

            expect(mockFileRepository.read).toHaveBeenCalledWith(
                "attachments/hw.pdf",
            );

            const zip = await JSZip.loadAsync(result);

            expect(zip.files["Alice_001/hw.pdf"]).toBeDefined();
        });

        it("should place each entry in its own folder when multiple entries share the same folder", async () => {
            const fileContent = Buffer.from("content");

            mockFileRepository.read.mockResolvedValue(fileContent);

            const result = await service.createZipArchive([
                {
                    folder: "Alice_001",
                    filename: "file1.pdf",
                    path: "attachments/file1.pdf",
                },
                {
                    folder: "Alice_001",
                    filename: "file2.pdf",
                    path: "attachments/file2.pdf",
                },
                {
                    folder: "Bob_002",
                    filename: "file3.pdf",
                    path: "attachments/file3.pdf",
                },
            ]);

            expect(mockFileRepository.read).toHaveBeenCalledTimes(3);

            const zip = await JSZip.loadAsync(result);

            expect(zip.files["Alice_001/file1.pdf"]).toBeDefined();
            expect(zip.files["Alice_001/file2.pdf"]).toBeDefined();
            expect(zip.files["Bob_002/file3.pdf"]).toBeDefined();
        });
    });
});
