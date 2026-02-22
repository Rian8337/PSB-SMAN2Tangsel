import { test, expect } from "@playwright/test";

test.describe("Homepage & i18n Localization", () => {
    test("Should default to Indonesian and allow switching to English", async ({
        page,
    }) => {
        await page.goto("/");

        await expect(page).not.toHaveURL(/\/id/);
        await expect(page.locator("h1")).toContainText("Selamat Datang");
        await expect(page.locator("p")).toContainText(
            "Portal e-learning resmi",
        );

        const enButton = page.getByRole("button", { name: "EN" });
        await expect(enButton).toBeVisible();
        await enButton.click();

        await expect(page).toHaveURL(/\/en/);
        await expect(page.locator("h1")).toContainText("Welcome");

        const idButton = page.getByRole("button", { name: "ID" });
        await expect(idButton).toBeVisible();
        await idButton.click();

        await expect(page).not.toHaveURL(/\/en/);
        await expect(page.locator("h1")).toContainText("Selamat Datang");
    });
});
