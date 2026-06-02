import { test, expect } from "./fixtures";

test.describe("Homepage & i18n Localization", () => {
    test("Should default to Indonesian and allow switching to English", async ({
        page,
    }) => {
        await page.goto("/");

        await expect(page).not.toHaveURL(/\/id/);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Selamat Datang",
        );

        await expect(page.locator("p")).toContainText(
            "Portal sumber belajar resmi",
        );

        const langButton = page.getByRole("button", {
            name: /change language/i,
        });

        await expect(langButton).toBeVisible();
        await langButton.click();

        await page.getByRole("menuitem", { name: /english/i }).click();

        await expect(page).toHaveURL(/\/en/);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Welcome",
        );

        await langButton.click();
        await page.getByRole("menuitem", { name: /bahasa indonesia/i }).click();

        await expect(page).not.toHaveURL(/\/en/);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
            "Selamat Datang",
        );
    });
});
