import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";

/**
 * Logs in as the first seeded student and waits for the dashboard to load.
 *
 * @param page The Playwright page object to perform actions on.
 */
export async function loginStudent(page: Page) {
    await loginUser(page, seededPrimaryData.students[0].nisn);
}

/**
 * Logs in as the first seeded teacher and waits for the dashboard to load.
 *
 * @param page The Playwright page object to perform actions on.
 */
export async function loginTeacher(page: Page) {
    await loginUser(page, seededPrimaryData.teachers[0].staffId.toString());
}

/**
 * Logs in as the first seeded administrator and waits for the dashboard to load.
 *
 * @param page The Playwright page object to perform actions on.
 */
export async function loginAdministrator(page: Page) {
    await loginUser(
        page,
        seededPrimaryData.administrators[0].staffId.toString(),
        "**/admin",
    );
}

async function loginUser(
    page: Page,
    identifier: string,
    waitURL = "**/dashboard",
) {
    await page.goto("/login");
    await page.fill('input[name="id"]', identifier);
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(waitURL);
}
