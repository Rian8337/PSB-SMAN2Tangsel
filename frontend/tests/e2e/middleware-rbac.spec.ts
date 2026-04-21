import { expect, test } from "./fixtures";
import { loginAdministrator, loginStudent } from "./utils/login";

test.describe("Middleware Role-Based Access Control (RBAC)", () => {
    test.describe("Unauthenticated Users", () => {
        test("should redirect unauthenticated users from /admin to /login", async ({
            page,
        }) => {
            await page.goto("/admin");
            await expect(page).toHaveURL(/\/login/);
        });

        test("should redirect unauthenticated users from /dashboard to /login", async ({
            page,
        }) => {
            await page.goto("/dashboard");
            await expect(page).toHaveURL(/\/login/);
        });
    });

    test.describe("Student-Teacher Role (Main Routes)", () => {
        test.beforeEach(async ({ page }) => {
            await loginStudent(page);
        });

        test("should allow access to /dashboard", async ({ page }) => {
            await page.goto("/dashboard");

            await expect(page).toHaveURL(/\/dashboard/);
            await expect(page.locator("h1, h2").first()).toBeVisible();
        });

        test("should block access to /admin and redirect back to /dashboard", async ({
            page,
        }) => {
            await page.goto("/admin/settings");
            await expect(page).toHaveURL(/\/dashboard/);
        });

        test("should redirect away from /login if already logged in", async ({
            page,
        }) => {
            await page.goto("/login");
            await expect(page).toHaveURL(/\/dashboard/);
        });
    });

    test.describe("Administrator Role (Admin Routes)", () => {
        test.beforeEach(async ({ page }) => {
            await loginAdministrator(page);
        });

        test("should allow access to /admin", async ({ page }) => {
            await page.goto("/admin");
            await expect(page).toHaveURL(/\/admin/);
        });

        test("should block access to /dashboard and redirect back to /admin", async ({
            page,
        }) => {
            await page.goto("/dashboard/classes");
            await expect(page).toHaveURL(/\/admin/);
        });

        test("should redirect away from /login to /admin if already logged in", async ({
            page,
        }) => {
            await page.goto("/login");
            await expect(page).toHaveURL(/\/admin/);
        });
    });
});
