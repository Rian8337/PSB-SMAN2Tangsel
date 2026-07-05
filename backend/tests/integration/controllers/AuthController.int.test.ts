import { users } from "@psb/shared/schema";
import {
    seededPrimaryData,
    testPassword,
    testPasswordHash,
} from "@psb/shared/tests";
import {
    ApiErrorBody,
    SuccessfulLoginResponse,
    UserRole,
} from "@psb/shared/types";
import { app } from "@test/setup/app";
import { loginWithCredentials, seeders, testDbManager } from "@test/utils";
import { eq } from "drizzle-orm";
import request from "supertest";

describe("AuthController (integration)", () => {
    const activeUser = seededPrimaryData.users[0];

    let deactivationTestUserId: number;
    const deactivationUserIdentifier = `22222${Date.now().toString().slice(-5)}`;

    beforeAll(async () => {
        // For testing the active state check in /me
        const deactivationUser = await seeders.users.seedOne({
            name: "Soon To Be Inactive User",
            identifier: deactivationUserIdentifier,
            password: testPasswordHash,
            role: UserRole.Student,
            active: true,
        });

        deactivationTestUserId = deactivationUser.id!;
    });

    afterAll(async () => {
        await testDbManager.db
            .delete(users)
            .where(eq(users.identifier, deactivationUserIdentifier));
    });

    describe("POST /auth/login", () => {
        const endpoint = "/auth/login";

        it("should successfully log in and set a session cookie", async () => {
            const res = await request(app).post(endpoint).send({
                id: activeUser.identifier,
                password: testPassword,
            });

            const body = res.body as SuccessfulLoginResponse;

            expect(res.status).toBe(200);
            expect(body.id).toBe(activeUser.id);
            expect(body.name).toBe(activeUser.name);
            expect(body.role).toBe(activeUser.role);

            expect(res.headers["set-cookie"]).toBeDefined();
            expect(res.headers["set-cookie"][0]).toContain("HttpOnly");
        });

        it("should return 400 if ID is missing", async () => {
            const res = await request(app).post(endpoint).send({
                password: testPassword,
            });

            const body = res.body as ApiErrorBody;

            expect(res.status).toBe(400);
            expect(body.error).toBeDefined();
        });

        it("should return 400 if password is missing", async () => {
            const res = await request(app).post(endpoint).send({
                id: activeUser.identifier,
            });

            const body = res.body as ApiErrorBody;

            expect(res.status).toBe(400);
            expect(body.error).toBeDefined();
        });

        it("should return 401 for invalid credentials", async () => {
            const res = await request(app).post(endpoint).send({
                id: activeUser.identifier,
                password: "WrongPassword123!",
            });

            expect(res.status).toBe(401);
        });
    });

    describe("GET /auth/me", () => {
        const endpoint = "/auth/me";

        it("should return 401 if not authenticated", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        describe("Authenticated User", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginWithCredentials(
                    agent,
                    activeUser.identifier,
                    testPassword,
                );
            });

            it("should return the user's own profile information", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as SuccessfulLoginResponse;

                expect(res.status).toBe(200);
                expect(body.id).toBe(activeUser.id);
                expect(body.name).toBe(activeUser.name);
            });
        });

        describe("Deactivated Authenticated User", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                // Log in while the user is still active to get a valid session cookie, then deactivate the user in the database.
                await loginWithCredentials(
                    agent,
                    deactivationUserIdentifier,
                    testPassword,
                );

                await testDbManager.db
                    .update(users)
                    .set({ active: false })
                    .where(eq(users.id, deactivationTestUserId));
            });

            it("should return 401 if the user is no longer active", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as ApiErrorBody;

                expect(res.status).toBe(401);
                expect(body.error).toBeDefined();
            });
        });
    });

    describe("POST /auth/logout", () => {
        const endpoint = "/auth/logout";
        const agent = request.agent(app);

        beforeAll(async () => {
            await loginWithCredentials(
                agent,
                activeUser.identifier,
                testPassword,
            );
        });

        it("should clear the session cookie and log the user out", async () => {
            const meRes = await agent.get("/auth/me");
            expect(meRes.status).toBe(200);

            const logoutRes = await agent.post(endpoint);

            expect(logoutRes.status).toBe(200);
            expect(logoutRes.headers["set-cookie"]).toBeDefined();

            const lockedOutRes = await agent.get("/auth/me");
            expect(lockedOutRes.status).toBe(401);
        });
    });
});
