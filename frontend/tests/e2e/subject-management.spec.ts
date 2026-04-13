import { Subject } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Subject Management", () => {
    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test("should complete the subject management flow", async ({ page }) => {
        // Generate a unique code to ensure no collision with existing seeded data.
        const uniqueSuffix = Date.now().toString().slice(-4);

        const testSubject: Subject = {
            id: 0,
            code: `E2E-${uniqueSuffix}`,
            name: `Mata Pelajaran E2E ${uniqueSuffix}`,
            active: true,
        };

        // Navigate
        // There are two links to the subject management page, one in the sidebar and one in the dashboard. We just need to click one of them.
        await page.locator('a[href="/admin/subjects"]').first().click();

        await expect(page).toHaveURL(/\/admin\/subjects/);
        await expect(page.locator("table")).toBeVisible();

        // Create subject
        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        const dialog = page.getByRole("dialog", {
            name: /daftar mata pelajaran baru|new subject/i,
        });

        await expect(async () => {
            await openCreateModalButton.click();
            await expect(dialog).toBeVisible();
        }).toPass({ timeout: 10000 });

        const codeInput = dialog.locator('input[name="code"]');
        const nameInput = dialog.locator('input[name="name"]');

        await codeInput.fill(testSubject.code);
        await nameInput.fill(testSubject.name);

        const createSubjectResponse = page.waitForResponse((response) => {
            const pathname = new URL(response.url()).pathname;

            return (
                response.request().method() === "POST" &&
                response.ok() &&
                /\/subjects\/?$/.test(pathname)
            );
        });

        await Promise.all([
            createSubjectResponse,
            dialog.getByRole("button", { name: /buat|create/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();
        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Animations are inconsistent across browsers. In WebKit, the dialog is hidden but still in the DOM
        // with data-state="closed". In Chromium/Firefox, it is unmounted from the DOM. Both are valid
        // implementations of hiding the dialog, so we check for both possibilities here.
        await expect(async () => {
            const count = await dialog.count();

            if (count > 0) {
                expect(await dialog.getAttribute("data-state")).toBe("closed");
            }
        }).toPass({ timeout: 5000 });

        // Search subject
        const searchInput = page.locator('input[name="search"]');

        const searchSubjectsResponse = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                response.ok() &&
                url.includes("/subjects/list") &&
                url.includes("query=")
            );
        });

        await searchInput.fill(testSubject.code);
        await searchSubjectsResponse;

        const subjectRow = page.getByRole("row", {
            name: new RegExp(testSubject.code, "i"),
        });

        await expect(subjectRow).toBeVisible();
        await expect(subjectRow).toContainText(testSubject.name);

        // Edit subject
        const editLink = subjectRow.getByRole("link", { name: /edit/i });
        await expect(editLink).toBeVisible();

        await editLink.focus();

        await Promise.all([
            page.waitForURL(/\/admin\/subjects\/\d+/),
            page.keyboard.press("Enter"),
        ]);

        const editNameInput = page.locator('input[name="name"]');
        await expect(editNameInput).toBeVisible();

        const updatedName = `${testSubject.name} Updated`;
        await editNameInput.fill(updatedName);

        const activeSwitch = page.getByRole("checkbox");
        await activeSwitch.click({ force: true });

        const updateButton = page.getByRole("button", {
            name: /simpan|save/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/subjects/);
        await expect(updateToast).toBeHidden();

        // Delete subject
        const searchUpdatedSubjectsResponse = page.waitForResponse(
            (response) => {
                const url = response.url();

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.includes("/subjects/list") &&
                    url.includes("query=")
                );
            },
        );

        await searchInput.fill(updatedName);
        await searchUpdatedSubjectsResponse;

        const updatedRow = page.getByRole("row", {
            name: new RegExp(testSubject.code, "i"),
        });

        await expect(updatedRow).toBeVisible();
        await expect(updatedRow).toContainText(updatedName);

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(testSubject.code);
            await confirmDialog.accept();
        });

        const deleteButton = updatedRow.getByRole("button", {
            name: new RegExp(`delete-${testSubject.code}`, "i"),
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();
        await expect(deleteToast).toBeHidden();

        // Search is still applied, so no subjects should be found
        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
