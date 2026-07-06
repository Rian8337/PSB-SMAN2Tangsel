import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@psb/shared/utils";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("View Subject Assignment Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);
    const seededAttachment = seededPrimaryData.attachments[0];

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    let classSubjectId: number;
    let visibleAssignmentId: number;
    let hiddenAssignmentId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-2",
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

        const [visibleAssignment, hiddenAssignment] =
            await seeders.assignments.seedMany(
                {
                    classSubjectId,
                    title: "Visible Assignment",
                    description: "Assignment description",
                    visible: true,
                },
                {
                    classSubjectId,
                    title: "Hidden Assignment",
                    visible: false,
                },
            );

        visibleAssignmentId = visibleAssignment.id!;
        hiddenAssignmentId = hiddenAssignment.id!;

        await seeders.assignmentAttachments.seedOne({
            assignmentId: visibleAssignmentId,
            attachmentId: seededAttachment.id,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student should see visible assignment content and submission form", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${visibleAssignmentId.toString()}`,
            );

            await expect(
                page.getByRole("heading", { name: subject.name }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Visible Assignment" }),
        ).toBeVisible();

        await expect(page.getByText("Assignment description")).toBeVisible();
        await expect(page.getByText(seededAttachment.name)).toBeVisible();

        // Submission form should be visible for a student with no submission.
        await expect(page.locator('input[type="file"]')).toBeVisible();

        // Management buttons should not be present.
        await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);

        await expect(page.getByRole("button", { name: "Hapus" })).toHaveCount(
            0,
        );
    });

    test("Student accessing a hidden assignment should be redirected to the subject dashboard", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${hiddenAssignmentId.toString()}`,
            );

            await expect(page).toHaveURL(
                new RegExp(`/subjects/${classSubjectId.toString()}$`),
                { timeout: 3000 },
            );
        }).toPass({ timeout: 15000 });
    });

    test("Teacher should see hidden assignment content and management buttons", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${hiddenAssignmentId.toString()}`,
            );

            await expect(
                page.getByRole("heading", { name: subject.name }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Hidden Assignment" }),
        ).toBeVisible();

        await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Hapus" })).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Tampilkan ke siswa" }),
        ).toBeVisible();
    });

    test("Attachment link should point to the backend download endpoint", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${visibleAssignmentId.toString()}`,
            );

            await page.waitForURL(
                new RegExp(`/assignments/${visibleAssignmentId.toString()}`),
                { timeout: 3000 },
            );

            await expect(page.getByText(seededAttachment.name)).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        const attachmentLink = page.getByRole("link", {
            name: seededAttachment.name,
        });

        await expect(attachmentLink).toHaveAttribute(
            "href",
            new RegExp(
                `/assignments/${visibleAssignmentId.toString()}/attachments/${seededAttachment.id.toString()}`,
            ),
        );
    });
});
