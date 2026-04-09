import { users } from "@psb/shared/schema";
import { testPassword, testPasswordHash } from "@psb/shared/tests";
import { UserListItem, UserRole } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginWithCredentials,
    seeders,
    testDbManager,
} from "@test/utils";
import { inArray } from "drizzle-orm";
import request from "supertest";

describe("UserController (integration)", () => {
    let testUserId: number;
    let testUserToDeleteId: number;

    const identifierSuffix = Date.now().toString().slice(-8);
    const testUserIdentifier = `10${identifierSuffix}`;
    const deleteUserIdentifier = `11${identifierSuffix}`;
    const createdUserIdentifier = `9${Date.now().toString()}`;
    const passwordTestIdentifier = `12${identifierSuffix}`;

    beforeAll(async () => {
        // For testing GET and PATCH operations
        const baseUser = await seeders.users.seedOne({
            name: "Integration Test User",
            identifier: testUserIdentifier,
            password: testPasswordHash,
            role: UserRole.student,
            active: true,
        });

        testUserId = baseUser.id!;

        // For testing the DELETE operation
        const userToDelete = await seeders.users.seedOne({
            name: "Delete Me User",
            identifier: deleteUserIdentifier,
            password: testPasswordHash,
            role: UserRole.student,
            active: true,
        });

        testUserToDeleteId = userToDelete.id!;

        // For testing the password update operation
        await seeders.users.seedOne({
            name: "Password Update User",
            identifier: passwordTestIdentifier,
            password: testPasswordHash,
            role: UserRole.student,
            active: true,
        });
    });

    afterAll(async () => {
        await testDbManager.db
            .delete(users)
            .where(
                inArray(users.identifier, [
                    testUserIdentifier,
                    deleteUserIdentifier,
                    createdUserIdentifier,
                    passwordTestIdentifier,
                ]),
            );

        await testDbManager.cleanupSecondaryTables();
    });

    describe("GET /users/list", () => {
        const endpoint = "/users/list";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should restrict access to list users", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(403);
            });
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should return a list of users", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as UserListItem[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThanOrEqual(2);
            });

            it("should correctly apply search queries", async () => {
                const res = await agent.get(
                    `${endpoint}?query=Integration Test`,
                );

                const body = res.body as UserListItem[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThan(0);
                expect(body[0].identifier).toBe(testUserIdentifier);
            });

            it("should return 400 for invalid limits", async () => {
                const res = await agent.get(`${endpoint}?limit=-5`);

                expect(res.status).toBe(400);
            });
        });
    });

    describe("GET /users/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should return detailed user information", async () => {
                const res = await agent.get(`/users/${testUserId.toString()}`);
                const body = res.body as UserListItem;

                expect(res.status).toBe(200);
                expect(body.id).toBe(testUserId);
                expect(body.name).toBe("Integration Test User");
                expect(body.role).toBe(UserRole.student);
            });

            it("should return 400 for invalid ID parameter", async () => {
                const res = await agent.get("/users/invalid-id");

                expect(res.status).toBe(400);
            });
        });
    });

    describe("POST /users/create", () => {
        const endpoint = "/users/create";

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should successfully create a new user", async () => {
                const res = await agent.post(endpoint).send({
                    name: "Brand New User",
                    identifier: createdUserIdentifier,
                    password: "StrongPassword123!",
                    role: UserRole.teacher,
                });

                expect(res.status).toBe(201);

                // Verify insertion
                const listRes = await agent.get(
                    `/users/list?query=${createdUserIdentifier}`,
                );

                const listBody = listRes.body as UserListItem[];

                expect(listBody.length).toBeGreaterThan(0);
                expect(listBody[0].name).toBe("Brand New User");
                expect(listBody[0].role).toBe(UserRole.teacher);
            });

            it("should return 400 for missing fields", async () => {
                const res = await agent.post(endpoint).send({
                    name: "Incomplete User",
                    // Missing password, role, identifier
                });

                expect(res.status).toBe(400);
            });
        });
    });

    describe("PATCH /users/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should update user name and active status", async () => {
                const res = await agent
                    .patch(`/users/${testUserId.toString()}`)
                    .send({
                        name: "Updated Integration User",
                        active: false,
                    });
                expect(res.status).toBe(200);

                // Verify the update
                const getRes = await agent.get(
                    `/users/${testUserId.toString()}`,
                );

                const getBody = getRes.body as UserListItem;

                expect(getBody.name).toBe("Updated Integration User");
                expect(getBody.active).toBe(false);
            });
        });
    });

    describe("PATCH /users/update-password", () => {
        const endpoint = "/users/update-password";

        describe("Authenticated User", () => {
            const agent = request.agent(app);
            const newPassword = "NewStrongPassword456!";

            beforeAll(async () => {
                await loginWithCredentials(agent, passwordTestIdentifier);
            });

            it("should return 400 if payload is malformed", async () => {
                // Missing newPassword
                const res = await agent
                    .patch(endpoint)
                    .send({ currentPassword: testPassword });

                expect(res.status).toBe(400);
            });

            it("should successfully update the password", async () => {
                const res = await agent.patch(endpoint).send({
                    currentPassword: testPassword,
                    newPassword: newPassword,
                });

                expect(res.status).toBe(200);

                // Verify the password was actually updated by attempting a new login
                const verificationAgent = request.agent(app);

                const loginRes = await loginWithCredentials(
                    verificationAgent,
                    passwordTestIdentifier,
                    newPassword,
                );

                expect(loginRes.status).toBe(200);
            });
        });
    });

    describe("DELETE /users/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should delete the user", async () => {
                const res = await agent.delete(
                    `/users/${testUserToDeleteId.toString()}`,
                );

                expect(res.status).toBe(204);

                // Verify it's gone from the list
                const listRes = await agent.get(
                    `/users/list?query=${deleteUserIdentifier}`,
                );

                const listBody = listRes.body as UserListItem[];

                expect(listBody.length).toBe(0);
            });
        });
    });
});
