import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Class Schedule Management", () => {
    const subject = seededPrimaryData.subjects[0];

    test.beforeAll(async ({ workerSetup: { dbManager } }) => {
        const { seeders } = dbManager;
        const session = seededPrimaryData.sessions[0];

        const clazz = await seeders.classes.seedOne({
            name: "X-1",
            session: session.session,
            semester: session.semester,
        });

        await seeders.classSubjects.seedOne({
            classId: clazz.id!,
            subjectId: subject.id,
        });
    });

    test.afterAll(async ({ workerSetup: { dbManager } }) => {
        await dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test("should complete the class schedule management flow", async ({
        page,
    }) => {
        const subjectQuery = subject.name;

        // Navigate to Class Management
        await page.locator('a[href="/admin/classes"]').first().click();
        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(page.locator("table")).toBeVisible();

        const scheduleLink = page.locator('a[href*="/schedules"]').first();
        await expect(scheduleLink).toBeVisible();
        await scheduleLink.click();

        await expect(page).toHaveURL(/\/admin\/classes\/\d+\/schedules/);

        // Create schedule
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
            .selectOption(ScheduleDay.tuesday.toString());

        await createDialog.locator('input[name="startTime"]').fill("08:00");
        await createDialog.locator('input[name="endTime"]').fill("09:30");

        const createScheduleResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "POST" &&
                response.ok() &&
                /\/schedule\/?$/.test(new URL(response.url()).pathname),
        );

        await Promise.all([
            createScheduleResponse,
            createDialog.getByRole("button", { name: /tambah|add/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Animations are inconsistent across browsers. In WebKit, the dialog is hidden but still in the DOM
        // with data-state="closed". In Chromium/Firefox, it is unmounted from the DOM. Both are valid
        // implementations of hiding the dialog, so we check for both possibilities here.
        await expect(async () => {
            const count = await createDialog.count();

            if (count > 0) {
                expect(await createDialog.getAttribute("data-state")).toBe(
                    "closed",
                );
            }
        }).toPass({ timeout: 5000 });

        // Verify & Edit Schedule
        const scheduleBlock = page
            .getByRole("button", { name: new RegExp(subjectQuery, "i") })
            .first();

        await expect(scheduleBlock).toBeVisible();

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

        // Update times
        await editDialog.locator('input[name="startTime"]').fill("10:00");
        await editDialog.locator('input[name="endTime"]').fill("11:30");

        const updateScheduleResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "PUT" &&
                response.ok() &&
                response.url().includes("/schedule/"),
        );

        await Promise.all([
            updateScheduleResponse,
            editDialog.getByRole("button", { name: /simpan|save/i }).click(),
        ]);

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Delete Schedule
        await Promise.all([
            page.waitForResponse(
                (res) =>
                    res.request().method() === "GET" &&
                    res.ok() &&
                    res.url().includes("/schedule/"),
            ),
            scheduleBlock.click(),
        ]);

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

        await Promise.all([
            deleteScheduleResponse,
            editDialog.getByRole("button", { name: /hapus|delete/i }).click(),
        ]);

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Verify it is removed from the grid.
        await expect(scheduleBlock).toBeHidden();
    });
});
