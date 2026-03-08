import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
    test("renders the login form with Indonesian labels by default", async ({
        page,
    }) => {
        await page.goto("/login");

        await expect(page.locator("h2")).toContainText("Masuk");
        await expect(page.getByLabel("ID")).toBeVisible();
        await expect(page.getByLabel("Kata sandi")).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Masuk" }),
        ).toBeVisible();
    });

    test("shows an error when login fails with invalid credentials", async ({
        page,
    }) => {
        await page.goto("/login");

        await page.getByLabel("ID").fill("0000000000");
        await page.getByLabel("Kata sandi").fill("wrongpassword");
        await page.getByRole("button", { name: "Masuk" }).click();

        await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    });

    test("renders the login form in English when navigating to /en/login", async ({
        page,
    }) => {
        await page.goto("/en/login");

        await expect(page.locator("h2")).toContainText("Login");
        await expect(page.getByLabel("ID")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Login" }),
        ).toBeVisible();
    });
});
