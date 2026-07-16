import { Page } from "@playwright/test";
import { seededPrimaryData, testPasswordHash } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@psb/shared/utils";
import { expect, test } from "./fixtures";
import { loginTeacher } from "./utils/login";

test.describe("Submission Analytics Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    const dayMs = 24 * 60 * 60 * 1000;

    // Comfortably in the past/future relative to whenever the suite actually runs, mirroring the
    // convention used by `AnalyticsRepository.int.test.ts`'s `getSubmissionAnalytics` fixtures.
    const pastDue = new Date(Date.now() - 7 * dayMs);
    const submittedBeforeDue = new Date(pastDue.getTime() - dayMs);
    const submittedAfterDue = new Date(pastDue.getTime() + dayMs);
    const futureDue = new Date(Date.now() + 7 * dayMs);

    const lateStudentName = "Submission Analytics Late Student";
    const missingStudentName = "Submission Analytics Missing Student";
    const pendingOnlyStudentName =
        "Submission Analytics Pending Only Student";

    /**
     * Returns the `<dd>` value locator for the summary stat whose `<dt>` label matches the given
     * text. Chakra's `Stat.Root`/`Stat.Label`/`Stat.ValueText` render as a `<dl>`/`<dt>`/`<dd>` triad,
     * and the four stats on this page are siblings (not nested), so filtering the `<dl>` by its
     * label text uniquely identifies the right one.
     */
    function getStatValueLocator(page: Page, label: string) {
        return page.locator("dl", { hasText: label }).locator("dd");
    }

    let classSubjectId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        async function seedStudent(identifier: string, name: string) {
            const user = await seeders.users.seedOne({
                active: true,
                name,
                password: testPasswordHash,
                role: UserRole.Student,
                identifier,
            });

            await seeders.students.seedOne({ userId: user.id! });

            return user.id!;
        }

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-SUBMISSION-ANALYTICS",
            session: session.session,
            semester: session.semester,
        });

        const classSubject = await seeders.classSubjects.seedOne({
            classId: cls.id!,
            subjectId: subject.id,
            teacherId: teacher.id,
        });

        classSubjectId = classSubject.id!;

        const lateStudentId = await seedStudent(
            "submission-analytics-late",
            lateStudentName,
        );

        const missingStudentId = await seedStudent(
            "submission-analytics-missing",
            missingStudentName,
        );

        const pendingOnlyStudentId = await seedStudent(
            "submission-analytics-pending-only",
            pendingOnlyStudentName,
        );

        for (const studentId of [
            lateStudentId,
            missingStudentId,
            pendingOnlyStudentId,
        ]) {
            await seeders.studentClasses.seedOne({
                classId: cls.id!,
                studentId,
            });
        }

        // Past due assignment: the late student submits after the deadline (-> late), the missing
        // student never submits (-> missing), and the pending-only student submits before the
        // deadline (-> on time), so that student ends up with no late/missing signal anywhere.
        const pastDueAssignment = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Submission Analytics Past Due Assignment",
            description: null,
            visible: true,
            dueAt: pastDue,
        });

        await seeders.assignmentSubmissions.seedOne({
            assignmentId: pastDueAssignment.id!,
            studentId: lateStudentId,
            createdAt: submittedAfterDue,
        });

        await seeders.assignmentSubmissions.seedOne({
            assignmentId: pastDueAssignment.id!,
            studentId: pendingOnlyStudentId,
            createdAt: submittedBeforeDue,
        });
        // missingStudentId never submits pastDueAssignment -> missing.

        // Future due assignment: nobody submits, so all three students are classified as "pending"
        // here. This must not create/inflate any concerningStudents entries -- in particular, the
        // pending-only student (who is on-time-but-otherwise-pending) must never appear in the
        // "Students Needing Attention" list.
        await seeders.assignments.seedOne({
            classSubjectId,
            title: "Submission Analytics Future Due Assignment",
            description: null,
            visible: true,
            dueAt: futureDue,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Teacher should see correct submission status summary and students needing attention", async ({
        page,
    }) => {
        await loginTeacher(page);

        // Right after login, a client-side redirect from the bare `/dashboard` route's own
        // resolver may still be in-flight, which can occasionally interrupt a bare `page.goto`
        // call. Wrapping the navigation + assertion in `toPass` retries past that race instead of
        // failing on it (mirrors `download-analytics.spec.ts`).
        await expect(async () => {
            await page.goto(`/id/${sessionCode}/analytics`);

            await expect(
                page.getByRole("heading", {
                    name: "Analitik Pengumpulan Tugas",
                }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        // Summary: onTime 1 (pending-only student on pastDueAssignment), late 1 (late student),
        // missing 1 (missing student), pending 3 (all three students on futureDueAssignment).
        await expect(getStatValueLocator(page, "Tepat Waktu")).toHaveText(
            "1",
        );
        await expect(getStatValueLocator(page, "Terlambat")).toHaveText("1");
        await expect(
            getStatValueLocator(page, "Tidak Dikumpulkan"),
        ).toHaveText("1");
        await expect(
            getStatValueLocator(page, "Belum Jatuh Tempo"),
        ).toHaveText("3");

        await expect(
            page.getByRole("heading", { name: "Siswa yang Perlu Perhatian" }),
        ).toBeVisible();

        // Find the narrowest container that holds the student's name, then walk up one level to
        // reach the row shared with the late/missing count texts (siblings, not descendants) --
        // mirrors the established pattern in `download-analytics.spec.ts`.
        const lateRow = page
            .locator("div", { hasText: lateStudentName })
            .last()
            .locator("..");

        await expect(lateRow.getByText("Terlambat: 1")).toBeVisible();
        await expect(lateRow.getByText("Tidak Dikumpulkan: 0")).toBeVisible();

        const missingRow = page
            .locator("div", { hasText: missingStudentName })
            .last()
            .locator("..");

        await expect(missingRow.getByText("Terlambat: 0")).toBeVisible();
        await expect(
            missingRow.getByText("Tidak Dikumpulkan: 1"),
        ).toBeVisible();

        // The pending-only student has no late/missing signal anywhere and must not appear in the
        // concern list at all.
        await expect(page.getByText(pendingOnlyStudentName)).toHaveCount(0);
    });
});
