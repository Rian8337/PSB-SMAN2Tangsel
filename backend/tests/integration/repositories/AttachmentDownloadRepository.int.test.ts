import { AttachmentDownloadRepository } from "@/repositories/AttachmentDownloadRepository";
import { getDownloadCounts } from "@/repositories/attachmentDownloadCounts";
import { attachmentDownloads } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import { seeders, testDb, testDbManager } from "@test/utils";
import { eq } from "drizzle-orm";

const repository = new AttachmentDownloadRepository(testDb);

const student = seededPrimaryData.users.find(
    (u) => u.identifier === "0012345678",
)!;

const otherStudent = seededPrimaryData.users.find(
    (u) => u.identifier === "0012345679",
)!;

const teacher = seededPrimaryData.users.find((u) => u.identifier === "2")!;

let attachmentAId: number;
let attachmentBId: number;
let attachmentCId: number;

beforeAll(async () => {
    const attachmentA = await seeders.attachments.seedOne({
        name: "Download Test Attachment A",
        path: "download_test_attachment_a.txt",
    });

    const attachmentB = await seeders.attachments.seedOne({
        name: "Download Test Attachment B",
        path: "download_test_attachment_b.txt",
    });

    const attachmentC = await seeders.attachments.seedOne({
        name: "Download Test Attachment C",
        path: "download_test_attachment_c.txt",
    });

    attachmentAId = attachmentA.id!;
    attachmentBId = attachmentB.id!;
    attachmentCId = attachmentC.id!;
});

afterAll(testDbManager.cleanupSecondaryTables);

// This file is the only writer to `attachmentDownloads` before the final `cleanupSecondaryTables` call above, so
// it is safe to fully clear the table between tests to keep them isolated from one another.
afterEach(async () => {
    await testDb.delete(attachmentDownloads);
});

describe("record", () => {
    it("should create a queryable download row", async () => {
        await repository.record(attachmentAId, student.id);

        const rows = await testDb
            .select()
            .from(attachmentDownloads)
            .where(eq(attachmentDownloads.attachmentId, attachmentAId));

        expect(rows).toHaveLength(1);
        expect(rows[0].attachmentId).toBe(attachmentAId);
        expect(rows[0].userId).toBe(student.id);
        expect(rows[0].downloadedAt).toBeTruthy();
    });

    it("should not deduplicate repeated downloads of the same attachment by the same user", async () => {
        await repository.record(attachmentAId, student.id);
        await repository.record(attachmentAId, student.id);

        const rows = await testDb
            .select()
            .from(attachmentDownloads)
            .where(eq(attachmentDownloads.attachmentId, attachmentAId));

        expect(rows).toHaveLength(2);

        const counts = await getDownloadCounts(testDb, [attachmentAId]);

        expect(counts.get(attachmentAId)).toBe(2);
    });
});

describe("getDownloadCounts", () => {
    it("should return an empty map for an empty array of attachment IDs", async () => {
        const counts = await getDownloadCounts(testDb, []);

        expect(counts).toEqual(new Map());
        expect(counts.size).toBe(0);
    });

    it("should return correct counts per attachment and omit attachments with zero downloads", async () => {
        await repository.record(attachmentAId, student.id);
        await repository.record(attachmentAId, otherStudent.id);
        await repository.record(attachmentBId, student.id);

        const counts = await getDownloadCounts(testDb, [
            attachmentAId,
            attachmentBId,
            attachmentCId,
        ]);

        expect(counts.get(attachmentAId)).toBe(2);
        expect(counts.get(attachmentBId)).toBe(1);
        expect(counts.has(attachmentCId)).toBe(false);
        expect(counts.get(attachmentCId)).toBeUndefined();
    });

    it("should count downloads from different users toward the same attachment's total", async () => {
        await repository.record(attachmentAId, student.id);
        await repository.record(attachmentAId, otherStudent.id);
        await repository.record(attachmentAId, teacher.id);

        const counts = await getDownloadCounts(testDb, [attachmentAId]);

        expect(counts.get(attachmentAId)).toBe(3);
    });
});
