import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Class Schedule Management", () => {
    const subject = seededPrimaryData.subjects[0];
    const subjectQuery = subject.name;
    const session = seededPrimaryData.sessions[0];
    const uniqueSuffix = Date.now().toString().slice(-6);

    const createClassName = `X-1 E2E Create ${uniqueSuffix}`;
    const editClassName = `X-1 E2E Edit ${uniqueSuffix}`;
    const deleteClassName = `X-1 E2E Delete ${uniqueSuffix}`;

    test.beforeAll(async ({ workerSetup: { dbManager } }) => {
        const { seeders } = dbManager;

        const [createClass, editClass, deleteClass] =
            await seeders.classes.seedMany(
                {
                    name: createClassName,
                    session: session.session,
                    semester: session.semester,
                },
                {
                    name: editClassName,
                    session: session.session,
                    semester: session.semester,
                },
                {
                    name: deleteClassName,
                    session: session.session,
                    semester: session.semester,
                },
            );

        const [, editClassSubject, deleteClassSubject] =
            await seeders.classSubjects.seedMany(
                { classId: createClass.id!, subjectId: subject.id },
                { classId: editClass.id!, subjectId: subject.id },
                { classId: deleteClass.id!, subjectId: subject.id },
            );

        await seeders.schedules.seedMany(
            {
                classSubjectId: editClassSubject.id!,
                day: ScheduleDay.Wednesday,
                startTime: new Date(2024, 0, 1, 8),
                endTime: new Date(2024, 0, 1, 9, 30),
            },
            {
                classSubjectId: deleteClassSubject.id!,
                day: ScheduleDay.Thursday,
                startTime: new Date(2024, 0, 1, 8),
                endTime: new Date(2024, 0, 1, 9, 30),
            },
        );
    });

    test.afterAll(async ({ workerSetup: { dbManager } }) => {
        await dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    async function navigateToClassSchedules(page: Page, className: string) {
        const dashboardCard = page
            .locator('a[href="/admin/classes"]')
            .filter({ hasText: /Atur ruang kelas untuk/i });

        await dashboardCard.click();
        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

        const classRow = page
            .locator("table tr")
            .filter({ hasText: new RegExp(className, "i") })
            .first();

        await expect(classRow).toBeVisible({ timeout: 15000 });

        const scheduleLink = classRow.locator('a[href*="/schedules"]').first();
        await expect(scheduleLink).toBeVisible();
        await scheduleLink.click();

        await expect(page).toHaveURL(/\/admin\/classes\/\d+\/schedules/);
    }

    function waitForScheduleGridRefresh(page: Page) {
        return page.waitForResponse((response) => {
            const url = new URL(response.url());

            return (
                response.request().method() === "GET" &&
                response.ok() &&
                /\/classes\/\d+\/schedules\/?$/.test(url.pathname)
            );
        });
    }

    test("should allow creating a class schedule", async ({ page }) => {
        await navigateToClassSchedules(page, createClassName);

        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        await openCreateModalButton.click();

        const createDialog = page.getByRole("dialog", {
            name: /tambah jadwal|add schedule/i,
        });

        await expect(createDialog).toBeVisible();

        const subjectInput = createDialog.getByPlaceholder(
            /pilih mata pelajaran|select subject/i,
        );

        await subjectInput.fill(subjectQuery);

        const subjectOption = createDialog
            .getByRole("listitem")
            .filter({ hasText: new RegExp(subjectQuery, "i") })
            .first();

        await subjectOption.click();

        await createDialog
            .locator('select[name="day"]')
            .selectOption(ScheduleDay.Tuesday.toString());

        await createDialog.locator('input[name="startTime"]').fill("08:00");
        await createDialog.locator('input[name="endTime"]').fill("09:30");

        const createScheduleResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "POST" &&
                response.ok() &&
                /\/schedule\/?$/.test(new URL(response.url()).pathname),
        );

        const refreshAfterCreateResponse = waitForScheduleGridRefresh(page);

        await Promise.all([
            createScheduleResponse,
            refreshAfterCreateResponse,
            createDialog.getByRole("button", { name: /tambah|add/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();
        await expect(createDialog).toBeHidden({ timeout: 10000 });

        const scheduleBlock = page
            .getByRole("button", { name: new RegExp(subjectQuery, "i") })
            .first();

        await expect(scheduleBlock).toBeVisible({ timeout: 15000 });
    });

    test("should allow editing a class schedule", async ({ page }) => {
        await navigateToClassSchedules(page, editClassName);

        const scheduleBlock = page
            .getByRole("button", { name: new RegExp(subjectQuery, "i") })
            .first();

        await expect(scheduleBlock).toBeVisible({ timeout: 15000 });

        const fetchSchedulePromise = page.waitForResponse((response) => {
            return (
                response.request().method() === "GET" &&
                /\/schedule\/\d+/.test(response.url())
            );
        });

        await scheduleBlock.click();

        const fetchResponse = await fetchSchedulePromise;
        expect(fetchResponse.ok()).toBe(true);

        const editDialog = page.getByRole("dialog", {
            name: /ubah jadwal|edit schedule/i,
        });

        await expect(editDialog).toBeVisible();

        await editDialog.locator('input[name="startTime"]').fill("10:00");
        await editDialog.locator('input[name="endTime"]').fill("11:30");

        const updateScheduleResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "PUT" &&
                response.ok() &&
                response.url().includes("/schedule/"),
        );

        const refreshAfterUpdateResponse = waitForScheduleGridRefresh(page);

        await Promise.all([
            updateScheduleResponse,
            refreshAfterUpdateResponse,
            editDialog.getByRole("button", { name: /simpan|save/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();
        await expect(editDialog).toBeHidden({ timeout: 10000 });
    });

    test("should allow deleting a class schedule", async ({ page }) => {
        await navigateToClassSchedules(page, deleteClassName);

        const scheduleBlock = page
            .getByRole("button", { name: new RegExp(subjectQuery, "i") })
            .first();

        await expect(scheduleBlock).toBeVisible({ timeout: 15000 });

        await Promise.all([
            page.waitForResponse(
                (res) =>
                    res.request().method() === "GET" &&
                    res.ok() &&
                    /\/schedule\/\d+/.test(res.url()),
            ),
            scheduleBlock.click(),
        ]);

        const editDialog = page.getByRole("dialog", {
            name: /ubah jadwal|edit schedule/i,
        });

        await expect(editDialog).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            await confirmDialog.accept();
        });

        const deleteScheduleResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "DELETE" &&
                response.ok() &&
                response.url().includes("/schedule/"),
        );

        const refreshAfterDeleteResponse = waitForScheduleGridRefresh(page);

        await Promise.all([
            deleteScheduleResponse,
            refreshAfterDeleteResponse,
            editDialog.getByRole("button", { name: /hapus|delete/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Verify it is removed from the grid.
        await expect(scheduleBlock).toBeHidden();
    });
});
