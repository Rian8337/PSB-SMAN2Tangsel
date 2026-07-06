import { UserRepository } from "@/repositories";
import { seededPrimaryData, testPasswordHash } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { seeders, testDb } from "@test/utils";

describe("UserRepository (integration)", () => {
    const repository = new UserRepository(testDb);
    const testUser = seededPrimaryData.users[0];

    describe("findById", () => {
        it("should return the user if they exist", async () => {
            const user = await repository.findById(testUser.id);

            expect(user).not.toBeNull();
            expect(user?.id).toBe(testUser.id);
            expect(user?.identifier).toBe(testUser.identifier);
        });

        it("should return null if the user does not exist", async () => {
            const user = await repository.findById(-1);

            expect(user).toBeNull();
        });
    });

    describe("listUsers", () => {
        it("should return a list of users with default pagination", async () => {
            const users = await repository.listUsers();

            expect(users.length).toBeGreaterThan(0);
            expect(users.length).toBeLessThanOrEqual(5);

            const user = users[0];

            expect(user).toHaveProperty("active");
            expect(user).toHaveProperty("id");
            expect(user).toHaveProperty("name");
            expect(user).toHaveProperty("role");
            expect(user).toHaveProperty("identifier");
        });

        it("should respect custom limit and offset parameters", async () => {
            const page1 = await repository.listUsers(
                undefined,
                undefined,
                2,
                0,
            );

            expect(page1).toHaveLength(2);

            const page2 = await repository.listUsers(
                undefined,
                undefined,
                2,
                2,
            );

            expect(page2.length).toBeGreaterThanOrEqual(1);

            expect(page1[0].id).not.toBe(page2[0].id);
            expect(page1[1].id).not.toBe(page2[0].id);
        });

        it("should return users matching a partial name search", async () => {
            const partialName = testUser.name.substring(1, 4);
            const users = await repository.listUsers(undefined, partialName);

            expect(users.length).toBeGreaterThan(0);
            expect(users.some((u) => u.id === testUser.id)).toBe(true);
        });

        it("should return users matching a partial identifier search", async () => {
            const partialIdentifier = testUser.identifier.slice(-3);

            const users = await repository.listUsers(
                undefined,
                partialIdentifier,
            );

            expect(users.length).toBeGreaterThan(0);
            expect(users.some((u) => u.id === testUser.id)).toBe(true);
        });

        it("should return an empty array if no users match the search", async () => {
            const users = await repository.listUsers(undefined, "nonexistent");

            expect(users).toHaveLength(0);
            expect(Array.isArray(users)).toBe(true);
        });

        it("should filter users by role", async () => {
            const users = await repository.listUsers(UserRole.Student);

            expect(users.length).toBeGreaterThan(0);
            expect(users.every((u) => u.role === UserRole.Student)).toBe(true);
        });
    });

    describe("countActiveAdministrators", () => {
        const extraAdminIdentifier = `9${Date.now().toString()}`;

        afterEach(async () => {
            await seeders.users.deleteWhere({
                identifier: extraAdminIdentifier,
            });
        });

        it("should count active administrators and support excluding a user", async () => {
            const baseline = await repository.countActiveAdministrators();

            const admin = await seeders.users.seedOne({
                name: "Extra Administrator",
                identifier: extraAdminIdentifier,
                password: testPasswordHash,
                role: UserRole.Administrator,
                active: true,
            });

            const afterSeed = await repository.countActiveAdministrators();
            expect(afterSeed).toBe(baseline + 1);

            const excludingNew = await repository.countActiveAdministrators(
                admin.id,
            );

            expect(excludingNew).toBe(baseline);
        });

        it("should not count inactive administrators", async () => {
            const baseline = await repository.countActiveAdministrators();

            await seeders.users.seedOne({
                name: "Inactive Administrator",
                identifier: extraAdminIdentifier,
                password: testPasswordHash,
                role: UserRole.Administrator,
                active: false,
            });

            const afterSeed = await repository.countActiveAdministrators();
            expect(afterSeed).toBe(baseline);
        });
    });
});
