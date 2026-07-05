import { createAdminAccount } from "@/cli/register-admin";
import { users } from "@psb/shared/schema";
import { UserRole } from "@psb/shared/types";
import { testDb, testDbManager } from "@test/utils";
import { eq } from "drizzle-orm";

describe("register-admin (integration)", () => {
    const identifierSuffix = Date.now().toString().slice(-8);
    const testIdentifier = `9${identifierSuffix}`;
    const duplicateIdentifier = `8${identifierSuffix}`;
    const testPassword = "Password1@";

    afterAll(async () => {
        await testDbManager.db
            .delete(users)
            .where(eq(users.identifier, testIdentifier));

        await testDbManager.db
            .delete(users)
            .where(eq(users.identifier, duplicateIdentifier));
    });

    it("should insert rows into users and administrators tables", async () => {
        await createAdminAccount(
            testDb,
            "Test Admin",
            testIdentifier,
            testPassword,
        );

        const [inserted] = await testDbManager.db
            .select()
            .from(users)
            .where(eq(users.identifier, testIdentifier));

        expect(inserted).toBeDefined();
        expect(inserted.name).toBe("Test Admin");
        expect(inserted.identifier).toBe(testIdentifier);
        expect(inserted.role).toBe(UserRole.Administrator);
        expect(inserted.active).toBe(true);
        expect(inserted.password).not.toBe(testPassword);
    });

    it("should throw when a duplicate identifier is used", async () => {
        await createAdminAccount(
            testDb,
            "First Admin",
            duplicateIdentifier,
            testPassword,
        );

        await expect(
            createAdminAccount(
                testDb,
                "Second Admin",
                duplicateIdentifier,
                testPassword,
            ),
        ).rejects.toThrow();
    });
});
