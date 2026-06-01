import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@/utils/sessionCode";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("View Subject Material Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);
    const seededAttachment = seededPrimaryData.attachments[0];

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.teacher,
    )!;

    let classSubjectId: number;
    let visibleMaterialId: number;
    let hiddenMaterialId: number;

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

        const [visibleMaterial, hiddenMaterial] =
            await seeders.materials.seedMany(
                {
                    classSubjectId,
                    title: "Visible Material",
                    description: "Material description",
                    visible: true,
                },
                { classSubjectId, title: "Hidden Material", visible: false },
            );

        visibleMaterialId = visibleMaterial.id!;
        hiddenMaterialId = hiddenMaterial.id!;

        await seeders.materialAttachments.seedOne({
            materialId: visibleMaterialId,
            attachmentId: seededAttachment.id,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student should see visible material content", async ({ page }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${visibleMaterialId.toString()}`,
            );

            await expect(
                page.getByRole("heading", { name: subject.name }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Visible Material" }),
        ).toBeVisible();

        await expect(page.getByText("Material description")).toBeVisible();
        await expect(page.getByText(seededAttachment.name)).toBeVisible();

        await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Hapus" })).toHaveCount(
            0,
        );
    });

    test("Student accessing a hidden material should be redirected to the subject dashboard", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${hiddenMaterialId.toString()}`,
            );

            await expect(page).toHaveURL(
                new RegExp(`/subjects/${classSubjectId.toString()}$`),
                { timeout: 3000 },
            );
        }).toPass({ timeout: 15000 });
    });

    test("Teacher should see hidden material content and action buttons", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${hiddenMaterialId.toString()}`,
            );

            await expect(
                page.getByRole("heading", { name: subject.name }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Hidden Material" }),
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
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${visibleMaterialId.toString()}`,
            );

            await expect(
                page.getByText(seededAttachment.name),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        const attachmentLink = page.getByRole("link", {
            name: seededAttachment.name,
        });

        await expect(attachmentLink).toHaveAttribute(
            "href",
            new RegExp(
                `/materials/${visibleMaterialId.toString()}/attachments/${seededAttachment.id.toString()}`,
            ),
        );
    });
});
