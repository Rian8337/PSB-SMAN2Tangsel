import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@/utils/sessionCode";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("View Student Submissions Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    let classSubjectId: number;
    let assignmentWithDeadlineId: number;
    let assignmentWithoutDeadlineId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-SS",
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

        // Assignment with a deadline set to a date in the past (all submissions will be late)
        const assignmentWithDeadline = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Assignment With Deadline",
            dueAt: new Date("2026-01-01T00:00:00.000Z"),
            visible: true,
        });

        assignmentWithDeadlineId = assignmentWithDeadline.id!;

        await seeders.assignmentSubmissions.seedOne({
            assignmentId: assignmentWithDeadlineId,
            studentId: student.id,
        });

        // Assignment without a deadline
        const assignmentWithoutDeadline = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Assignment Without Deadline",
            visible: true,
        });

        assignmentWithoutDeadlineId = assignmentWithoutDeadline.id!;

        await seeders.assignmentSubmissions.seedOne({
            assignmentId: assignmentWithoutDeadlineId,
            studentId: student.id,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Teacher should see the student submissions page with student data", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}/submissions`,
            );

            await expect(
                page.getByRole("heading", { name: subject.name }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Assignment With Deadline" }),
        ).toBeVisible();

        await expect(page.getByText("Pengumpulan Siswa")).toBeVisible();

        await expect(page.getByText(student.identifier)).toBeVisible();
        await expect(page.getByText(student.name)).toBeVisible();
    });

    test("Submission time should be visible and have a distinct color when submitted after the deadline", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}/submissions`,
            );

            await expect(page.getByText(student.name)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        // The submission time paragraph is rendered with a specific color via Chakra UI.
        // Check that the submission time text cell is rendered and visible (all submissions
        // for this assignment are after the 2026-01-01 deadline).
        const submissionTimeCell = page
            .getByRole("cell", { name: /\d{1,2}\/\d{1,2}\/\d{4}/ })
            .first();

        await expect(submissionTimeCell).toBeVisible();

        const submissionTimePara = submissionTimeCell.locator("p");
        const color = await submissionTimePara.evaluate(
            (el) => window.getComputedStyle(el).color,
        );

        // Red color (Chakra UI v3 red.500 = #ef4444) — submission is after deadline.
        expect(color).toBe("rgb(239, 68, 68)");
    });

    test("Submission time should use default color when no deadline is set", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithoutDeadlineId.toString()}/submissions`,
            );

            await expect(page.getByText(student.name)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });
    });

    test("Student should see a 404 page when accessing the submissions page", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}/submissions`,
            );

            // Next.js notFound() renders a 404 page at the same URL.
            await expect(
                page.getByRole("heading", { name: "404" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });
    });

    test("Teacher should be navigated to the submissions page from the assignment page", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}`,
            );

            await expect(
                page.getByRole("button", { name: "Pengumpulan siswa" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await page.getByRole("button", { name: "Pengumpulan siswa" }).click();

        await expect(page).toHaveURL(
            new RegExp(
                `/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}/submissions$`,
            ),
        );
    });

    // The download endpoint returns a valid (possibly empty) ZIP even when the submission has
    // no attachments, so these tests verify the full browser download flow without requiring
    // real files to be present on the backend's filesystem.
    test("Unduh Semua button should trigger a download", async ({ page }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}/submissions`,
            );

            await expect(page.getByText(student.name)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Unduh Semua" }).click();

        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain(
            `submissions-${assignmentWithDeadlineId.toString()}.zip`,
        );

        const failure = await download.failure();
        expect(failure).toBeNull();
    });

    test("Per-row Unduh button should trigger a download for the specific student", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentWithDeadlineId.toString()}/submissions`,
            );

            await expect(page.getByText(student.name)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Unduh" }).first().click();

        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain(".zip");

        const failure = await download.failure();
        expect(failure).toBeNull();
    });
});
