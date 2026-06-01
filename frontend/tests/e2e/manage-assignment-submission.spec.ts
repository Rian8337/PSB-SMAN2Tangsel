import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@/utils/sessionCode";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("Manage Assignment Submission Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.teacher,
    )!;

    let classSubjectId: number;
    let assignmentId: number;
    let submitAssignmentId: number;
    let removeAssignmentId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-UC14",
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

        const assignments = await seeders.assignments.seedMany(
            {
                classSubjectId,
                title: "Tugas untuk Pengumpulan",
                visible: true,
            },
            {
                classSubjectId,
                title: "Tugas untuk Submit E2E",
                visible: true,
            },
            {
                classSubjectId,
                title: "Tugas untuk Hapus E2E",
                visible: true,
            },
        );

        assignmentId = assignments[0].id!;
        submitAssignmentId = assignments[1].id!;
        removeAssignmentId = assignments[2].id!;

        // Pre-seed a submission for the remove test.
        await seeders.assignmentSubmissions.seedOne({
            assignmentId: removeAssignmentId,
            studentId: student.id,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student sees file upload form when no submission exists", async ({
        page,
    }) => {
        await loginStudent(page);

        // First navigation to this route may lose a race against Next.js dev-server
        // bundle compilation, causing the component to redirect before load fires.
        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentId.toString()}`,
            );

            await page.waitForURL(
                new RegExp(`/assignments/${assignmentId.toString()}`),
                { timeout: 3000 },
            );

            await expect(
                page.getByRole("heading", { name: "Tugas untuk Pengumpulan" }),
            ).toBeVisible({ timeout: 5000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByLabel(/tambah berkas/i),
        ).toBeVisible({ timeout: 10000 });

        await expect(
            page.getByRole("button", { name: /kumpulkan/i }),
        ).toBeVisible();
    });

    test("Student can submit a file to an assignment", async ({ page }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${submitAssignmentId.toString()}`,
            );

            await expect(
                page.getByLabel(/tambah berkas/i),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await page
            .getByLabel(/tambah berkas/i)
            .setInputFiles({
                name: "tugas.txt",
                mimeType: "text/plain",
                buffer: Buffer.from("isi tugas"),
            });

        await expect(async () => {
            await page.getByRole("button", { name: /kumpulkan/i }).click();

            // After a successful submission the form transitions to the submission
            // view, which shows Edit/Hapus buttons instead of the upload form.
            await expect(
                page.getByRole("button", { name: /edit/i }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });
    });

    test("Student cannot submit again after already submitting", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${submitAssignmentId.toString()}`,
            );

            // After reloading, the submission section should show edit/remove buttons.
            await expect(
                page.getByRole("button", { name: /edit/i }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        // The submit button should not be present (form is not shown).
        await expect(
            page.getByRole("button", { name: /^kumpulkan$/i }),
        ).toHaveCount(0);
    });

    test("Student can remove their submission", async ({ page }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${removeAssignmentId.toString()}`,
            );

            await page.waitForURL(
                new RegExp(`/assignments/${removeAssignmentId.toString()}`),
                { timeout: 3000 },
            );

            await expect(
                page.getByRole("button", { name: /hapus/i }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        page.once("dialog", (dialog) => dialog.accept());

        await page.getByRole("button", { name: /hapus/i }).click();

        // After removal the file upload form should reappear.
        await expect(
            page.getByLabel(/tambah berkas/i),
        ).toBeVisible({ timeout: 10000 });
    });

    test("Teacher cannot see the submission form", async ({ page }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentId.toString()}`,
            );

            await expect(
                page.getByRole("heading", { name: "Tugas untuk Pengumpulan" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByLabel(/tambah berkas/i),
        ).toHaveCount(0);
    });
});
