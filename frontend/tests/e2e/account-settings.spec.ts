import { test, expect } from "@playwright/test";
import { loginStudent } from "./utils/login";

test.describe("Account Settings", () => {
    test.beforeEach(async ({ page }) => {
        await loginStudent(page);
        await page.goto("/settings");
    });

    test("should prevent submission if fields are empty", async ({ page }) => {
        const currentPasswordInput = page.getByPlaceholder(/saat ini|current/i);

        await page
            .locator("form")
            .getByRole("button", { name: /perbarui|change/i })
            .click();

        await expect(currentPasswordInput).toHaveJSProperty(
            "validity.valueMissing",
            true,
        );

        await expect(currentPasswordInput).toHaveJSProperty(
            "validity.valid",
            false,
        );

        // This should not appear because the browser should prevent the form submission, but we check it just in case.
        await expect(
            page.getByText(
                /harap isi semua bidang|fill in all required fields/i,
            ),
        ).toBeHidden();
    });

    test("should prevent submission of weak passwords client-side", async ({
        page,
    }) => {
        const currentPasswordInput = page.getByPlaceholder(/saat ini|current/i);

        await currentPasswordInput.click();
        await currentPasswordInput.pressSequentially("ValidOldPass1!");

        const newPasswordInput = page.getByPlaceholder(/baru|new/i);
        await newPasswordInput.click();
        await newPasswordInput.pressSequentially("weak");

        await page
            .locator("form")
            .getByRole("button", { name: /perbarui|change/i })
            .click();

        await expect(
            page.getByText(/kata sandi baru tidak valid/i),
        ).toBeVisible();
    });

    test("should successfully update password and show real toast", async ({
        page,
    }) => {
        await page.route("**/users/update-password", async (route) => {
            await route.fulfill({ status: 200 });
        });

        const currentPasswordInput = page.getByPlaceholder(/saat ini|current/i);
        await currentPasswordInput.click();
        await currentPasswordInput.pressSequentially("ValidOldPass1!");

        const newPasswordInput = page.getByPlaceholder(/baru|new/i);
        await newPasswordInput.click();
        await newPasswordInput.pressSequentially("NewStrongPass2@");

        await page
            .locator("form")
            .getByRole("button", { name: /perbarui|change/i })
            .click();

        const toast = page.getByText(/berhasil|successfully/i);

        await expect(toast).toBeVisible();
        await expect(page.getByPlaceholder(/saat ini|current/i)).toBeEmpty();
        await expect(page.getByPlaceholder(/baru|new/i)).toBeEmpty();
    });

    test("should show error toast for incorrect current password", async ({
        page,
    }) => {
        await page.route("**/api/users/update-password", async (route) => {
            await route.fulfill({
                status: 400,
                contentType: "application/json",
                body: JSON.stringify({ error: "Invalid password" }),
            });
        });

        const currentPasswordInput = page.getByPlaceholder(/saat ini|current/i);
        await currentPasswordInput.click();
        await currentPasswordInput.pressSequentially("WrongPassword1!");

        const newPasswordInput = page.getByPlaceholder(/baru|new/i);
        await newPasswordInput.click();
        await newPasswordInput.pressSequentially("NewStrongPass2@");

        await page
            .locator("form")
            .getByRole("button", { name: /perbarui|change/i })
            .click();

        const errorToast = page.getByText(/gagal|failed/i);
        await expect(errorToast).toBeVisible();
    });
});
