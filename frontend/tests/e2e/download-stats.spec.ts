import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@psb/shared/utils";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("Download Stats Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    // The backend process for this worker is spawned (see `fixtures.ts`) with
    // `STORAGE_PATH: "./tests/storage"` relative to the backend package's directory. Since this test
    // file executes with a cwd of the frontend package's directory (see `pretest:e2e`/`test:e2e` in
    // `package.json`), the equivalent path from here is `../backend/tests/storage`.
    const storagePath = join("..", "backend", "tests", "storage");

    // Every worker spawns its backend against the SAME literal storage path string, so concurrently
    // running workers physically share this directory on disk. Use a filename unique to this worker/run
    // to avoid collisions with another worker's test writing/reading/deleting a same-named file.
    const attachmentFileName = `download_stats_${process.pid.toString()}_${Date.now().toString()}_${Math.random().toString(36).slice(2)}.txt`;
    const attachmentFilePath = join(storagePath, attachmentFileName);
    const attachmentName = "Download Stats Attachment.txt";

    let classSubjectId: number;
    let materialId: number;
    let attachmentId: number;

    /**
     * Clicks the attachment's download link and waits for the underlying HTTP response, asserting it
     * succeeded (status 200 with the expected `Content-Disposition` header) rather than 404ing.
     *
     * A response-based wait is used instead of Playwright's `page.waitForEvent("download")` because the
     * attachment link is a cross-origin `<a download>` (the backend runs on a different port than the
     * frontend). WebKit intentionally ignores the `download` attribute for cross-origin links (it falls
     * back to a normal navigation instead, per WebKit's own security policy), which means it never
     * surfaces the click as a Playwright "download" event even though the underlying GET request
     * genuinely succeeds. Waiting on the network response instead still exercises a real HTTP GET
     * against the download endpoint — which is what actually drives the download count — uniformly
     * across Chromium, Firefox, and WebKit.
     */
    async function downloadAttachment(page: Page) {
        const responsePromise = page.waitForResponse(
            (res) =>
                res
                    .url()
                    .includes(
                        `/materials/${materialId.toString()}/attachments/${attachmentId.toString()}`,
                    ) && res.request().method() === "GET",
        );

        await page.getByRole("link", { name: attachmentName }).click();

        const response = await responsePromise;

        expect(response.status()).toBe(200);
        expect(response.headers()["content-disposition"]).toBe(
            `attachment; filename="${attachmentName}"`,
        );
    }

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        await mkdir(storagePath, { recursive: true });
        await writeFile(attachmentFilePath, "download stats e2e test content");

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-DOWNLOAD-STATS",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: cls.id!,
            studentId: student.id,
        });

        const classSubject = await seeders.classSubjects.seedOne({
            classId: cls.id!,
            subjectId: subject.id,
            teacherId: teacher.id,
        });

        classSubjectId = classSubject.id!;

        const material = await seeders.materials.seedOne({
            classSubjectId,
            title: "Download Stats Material",
            visible: true,
        });

        materialId = material.id!;

        const attachment = await seeders.attachments.seedOne({
            name: attachmentName,
            path: attachmentFileName,
        });

        attachmentId = attachment.id!;

        await seeders.materialAttachments.seedOne({
            materialId,
            attachmentId,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await rm(attachmentFilePath, { force: true });
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student should be able to download the material attachment", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${materialId.toString()}`,
            );

            await expect(page.getByText(attachmentName)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        // Students must never see download counts, regardless of whether they've downloaded the
        // attachment themselves.
        await expect(page.getByText(/Diunduh \d+ kali/)).toHaveCount(0);

        await downloadAttachment(page);
    });

    test("Teacher should see the download count as 1 after a student download", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${materialId.toString()}`,
            );

            await expect(page.getByText("Diunduh 1 kali")).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });
    });

    test("Second student download should not be deduplicated", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${materialId.toString()}`,
            );

            await expect(page.getByText(attachmentName)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        await downloadAttachment(page);
    });

    test("Teacher should see the download count as 2 after reloading following a second download", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${materialId.toString()}`,
            );

            await expect(page.getByText("Diunduh 2 kali")).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });
    });
});
