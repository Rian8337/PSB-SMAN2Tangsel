import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Class Schedule Management", () => {
    const subject = seededPrimaryData.subjects[0];
    const className = `X-1 E2E ${Date.now().toString().slice(-6)}`;

    test.beforeAll(async ({ workerSetup: { dbManager } }) => {
        const { seeders } = dbManager;
        const session = seededPrimaryData.sessions[0];

        const clazz = await seeders.classes.seedOne({
            name: className,
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

        const waitForScheduleGridRefresh = () =>
            page.waitForResponse((response) => {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    /\/classes\/\d+\/schedules\/?$/.test(url.pathname)
                );
            });

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

        const refreshAfterCreateResponse = waitForScheduleGridRefresh();

        await Promise.all([
            createScheduleResponse,
            refreshAfterCreateResponse,
            createDialog.getByRole("button", { name: /tambah|add/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();
        await expect(createDialog).toBeHidden({ timeout: 10000 });

        // Verify & Edit Schedule
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

        // Update times
        await editDialog.locator('input[name="startTime"]').fill("10:00");
        await editDialog.locator('input[name="endTime"]').fill("11:30");

        const updateScheduleResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "PUT" &&
                response.ok() &&
                response.url().includes("/schedule/"),
        );

        const refreshAfterUpdateResponse = waitForScheduleGridRefresh();

        await Promise.all([
            updateScheduleResponse,
            refreshAfterUpdateResponse,
            editDialog.getByRole("button", { name: /simpan|save/i }).click(),
        ]);

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();
        await expect(editDialog).toBeHidden({ timeout: 10000 });

        // Delete Schedule
        await Promise.all([
            page.waitForResponse(
                (res) =>
                    res.request().method() === "GET" &&
                    res.ok() &&
                    /\/schedule\/\d+/.test(res.url()),
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

        const refreshAfterDeleteResponse = waitForScheduleGridRefresh();

        await Promise.all([
            deleteScheduleResponse,
            refreshAfterDeleteResponse,
            editDialog.getByRole("button", { name: /hapus|delete/i }).click(),
        ]);

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Verify it is removed from the grid.
        await expect(scheduleBlock).toBeHidden();
    });
});
