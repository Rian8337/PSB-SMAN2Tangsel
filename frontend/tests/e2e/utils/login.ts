import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";

/**
 * Logs in as the first seeded student and waits for the dashboard to load.
 *
 * @param page The Playwright page object to perform actions on.
 */
export async function loginStudent(page: Page) {
    await loginUser(page, UserRole.student);
}

/**
 * Logs in as the first seeded teacher and waits for the dashboard to load.
 *
 * @param page The Playwright page object to perform actions on.
 */
export async function loginTeacher(page: Page) {
    await loginUser(page, UserRole.teacher);
}

/**
 * Logs in as the first seeded administrator and waits for the dashboard to load.
 *
 * @param page The Playwright page object to perform actions on.
 */
export async function loginAdministrator(page: Page) {
    await loginUser(page, UserRole.administrator);
}

async function loginUser(page: Page, role: UserRole) {
    const user = seededPrimaryData.users.find((u) => u.role === role);

    if (!user) {
        throw new Error(`No seeded user found for role ${role.toString()}`);
    }

    await page.goto("/login");
    await page.fill('input[name="id"]', user.identifier);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL(
        user.role === UserRole.administrator ? "**/admin" : "**/dashboard",
    );
}
