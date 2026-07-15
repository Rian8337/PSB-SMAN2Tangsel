import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@psb/shared/utils";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("Download Analytics Flow", () => {
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
    const attachmentFileName = `download_analytics_${process.pid.toString()}_${Date.now().toString()}_${Math.random().toString(36).slice(2)}.txt`;
    const attachmentFilePath = join(storagePath, attachmentFileName);
    const attachmentName = "Download Analytics Attachment.txt";
    const materialTitle = "Download Analytics Material";

    let classSubjectId: number;
    let materialId: number;
    let attachmentId: number;

    /**
     * Clicks the attachment's download link and waits for the underlying HTTP response, asserting it
     * succeeded (status 200) rather than 404ing. See `download-stats.spec.ts` for the full rationale
     * behind waiting on the network response instead of Playwright's `download` event (cross-origin
     * `<a download>` links are not reliably surfaced as download events across all browser engines).
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
    }

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        await mkdir(storagePath, { recursive: true });
        await writeFile(
            attachmentFilePath,
            "download analytics e2e test content",
        );

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-DOWNLOAD-ANALYTICS",
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
            title: materialTitle,
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

    // Each download uses its own test (and therefore its own fresh `page`), re-navigating to the
    // material detail page beforehand. Downloading twice in a row on the SAME page instance is not
    // safe here: WebKit does not honor the cross-origin `download` attribute, and clicking the link a
    // second time on a page already left in that state closes the page/context outright (confirmed
    // via a real WebKit failure — "Target page, context or browser has been closed" — when this was
    // written as a single test with two sequential `downloadAttachment` calls). This mirrors the
    // established two-separate-tests pattern in `download-stats.spec.ts`.
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

        await downloadAttachment(page);
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

    test("Teacher should reach the analytics page via the bare route and see the material with a download count of 2", async ({
        page,
    }) => {
        await loginTeacher(page);

        // Navigating to the bare `/analytics` route (as the sidebar nav link does) triggers a
        // server-side redirect to the active session's analytics page. Right after login, a
        // client-side redirect from the bare `/dashboard` route's own resolver may still be
        // in-flight, which can occasionally interrupt a bare `page.goto` call. Wrapping the
        // navigation + assertion in `toPass` retries past that race instead of failing on it.
        await expect(async () => {
            await page.goto("/id/analytics");

            await expect(page).toHaveURL(
                new RegExp(`/${sessionCode}/analytics$`),
                { timeout: 3000 },
            );
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Analitik Unduhan" }),
        ).toBeVisible();

        // Find the narrowest container that holds the material's title, then walk up one level to
        // reach the row shared with its download-count badge (a sibling element, not a descendant).
        const titleContainer = page
            .locator("div", { hasText: materialTitle })
            .last();
        const row = titleContainer.locator("..");

        await expect(row.getByText("2", { exact: true })).toBeVisible();
    });

    test("Student navigating directly to the session's analytics page should see a 404", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(`/id/${sessionCode}/analytics`);

            // Next.js notFound() renders a 404 page at the same URL.
            await expect(
                page.getByRole("heading", { name: "404" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });
    });
});
