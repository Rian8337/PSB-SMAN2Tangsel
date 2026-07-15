import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@psb/shared/utils";
import { expect, test } from "./fixtures";
import { loginStudent } from "./utils/login";

test.describe("Bookmark Material Flow", () => {
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
    let materialId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-BOOKMARK",
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
            title: "Bookmarkable Material",
            visible: true,
        });

        materialId = material.id!;
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student can bookmark a material from the subject dashboard and find it on the bookmarks page", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}`,
            );

            await expect(page.getByText("Bookmarkable Material")).toBeVisible({
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });

        await page
            .getByRole("button", { name: "Tambahkan ke bookmark" })
            .click();

        await expect(
            page.getByRole("button", { name: "Hapus dari bookmark" }),
        ).toBeVisible();

        await page.goto(`/id/${sessionCode}/bookmarks`);

        await expect(
            page.getByRole("heading", { name: "Bookmark Saya" }),
        ).toBeVisible();
        await expect(page.getByText("Bookmarkable Material")).toBeVisible();
    });

    test("Student can remove a bookmark from the material detail page", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(
                `/id/${sessionCode}/subjects/${classSubjectId.toString()}/materials/${materialId.toString()}`,
            );

            await expect(
                page.getByRole("button", { name: "Hapus dari bookmark" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        await page.getByRole("button", { name: "Hapus dari bookmark" }).click();

        await expect(
            page.getByRole("button", { name: "Tambahkan ke bookmark" }),
        ).toBeVisible();

        await page.goto(`/id/${sessionCode}/bookmarks`);

        await expect(
            page.getByText("Belum ada materi yang dibookmark."),
        ).toBeVisible();
    });

    test("Navigating to the bare /bookmarks route (as the sidebar nav link does) redirects to the active session's bookmarks page", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto("/id/bookmarks");

            await expect(page).toHaveURL(
                new RegExp(`/${sessionCode}/bookmarks$`),
                { timeout: 3000 },
            );
        }).toPass({ timeout: 15000 });

        await expect(
            page.getByRole("heading", { name: "Bookmark Saya" }),
        ).toBeVisible();
    });
});
