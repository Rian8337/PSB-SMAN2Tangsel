import { sessions } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import {
    AcademicSessionDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import { eq, or } from "drizzle-orm";
import request from "supertest";

describe("SessionController (integration)", () => {
    const activeSession = seededPrimaryData.sessions[0];

    const inactiveSession: ValidSession = "2022/2023";
    const inactiveSemester: ValidSemester = 2;

    const sessionToDelete: ValidSession = "2020/2021";
    const sessionToDeleteSemester: ValidSemester = 1;

    beforeAll(async () => {
        // For updating
        await seeders.sessions.seedOne({
            session: inactiveSession,
            semester: inactiveSemester,
            startTime: new Date(2024, 0, 1),
            endTime: new Date(2024, 5, 30),
            active: null,
        });

        // For testing deletion
        await seeders.sessions.seedOne({
            session: sessionToDelete,
            semester: sessionToDeleteSemester,
            startTime: new Date(2020, 6, 1),
            endTime: new Date(2020, 11, 31),
            active: null,
        });
    });

    afterAll(async () => {
        await testDbManager.db
            .delete(sessions)
            .where(
                or(
                    eq(sessions.session, inactiveSession),
                    eq(sessions.session, sessionToDelete),
                ),
            );
    });

    describe("GET /sessions/active", () => {
        const endpoint = "/sessions/active";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should allow any authenticated user to fetch the active session", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as AcademicSessionDTO;

                expect(res.status).toBe(200);
                expect(body.session).toBe(activeSession.session);
                expect(body.semester).toBe(activeSession.semester);
                expect(body.active).toBe(true);
            });
        });
    });

    describe("GET /sessions", () => {
        const endpoint = "/sessions";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should retrieve a specific session by query params", async () => {
                const res = await agent.get(
                    `${endpoint}?session=${encodeURIComponent(inactiveSession)}&semester=${inactiveSemester.toString()}`,
                );
                const body = res.body as AcademicSessionDTO;

                expect(res.status).toBe(200);
                expect(body.session).toBe(inactiveSession);
                expect(body.semester).toBe(inactiveSemester);
            });

            it("should return 400 for missing query params", async () => {
                const res = await agent.get(endpoint);
                expect(res.status).toBe(400);
            });
        });
    });

    describe("GET /sessions/list", () => {
        const endpoint = "/sessions/list";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should return a list of sessions", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as AcademicSessionDTO[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThanOrEqual(3);
            });

            it("should correctly apply search queries", async () => {
                const res = await agent.get(`${endpoint}?query=2022`);
                const body = res.body as AcademicSessionDTO[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body[0].session).toContain("2022");
            });
        });
    });

    describe("POST /sessions", () => {
        const endpoint = "/sessions";

        const payload: AcademicSessionDTO = {
            session: "2025/2026",
            semester: 1,
            startTime: new Date(2025, 6, 1).getTime(),
            endTime: new Date(2025, 11, 31).getTime(),
            active: false,
        };

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).post(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should successfully create a new session if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.post(endpoint).send(payload);

            expect(res.status).toBe(201);

            // Verify insertion
            const getRes = await agent.get(
                `${endpoint}?session=2025%2F2026&semester=1`,
            );

            const getBody = getRes.body as AcademicSessionDTO;
            expect(getBody.session).toBe("2025/2026");
        });
    });

    describe("PUT /sessions", () => {
        const endpoint = "/sessions";

        const newStartTime = new Date(2024, 0, 5).getTime();

        const payload: AcademicSessionDTO = {
            session: inactiveSession,
            semester: inactiveSemester,
            startTime: newStartTime,
            endTime: new Date(2024, 5, 30).getTime(),
            active: true,
        };

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).put(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.put(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.put(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should update an existing session", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.put(endpoint).send(payload);

            expect(res.status).toBe(204);

            // Verify the update via the /active endpoint since we made it active
            const activeRes = await agent.get(`${endpoint}/active`);
            const activeBody = activeRes.body as AcademicSessionDTO;

            expect(activeBody.session).toBe(inactiveSession);
            expect(activeBody.startTime).toBe(newStartTime);
        });
    });

    describe("DELETE /sessions", () => {
        const endpoint = "/sessions";

        const payload = {
            session: sessionToDelete,
            semester: sessionToDeleteSemester,
        };

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).delete(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should delete the session via body payload if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(endpoint).send(payload);

            expect(res.status).toBe(204);

            // Verify it's gone
            const getRes = await agent.get(
                `${endpoint}?session=${encodeURIComponent(sessionToDelete)}&semester=${sessionToDeleteSemester.toString()}`,
            );

            expect(getRes.status).toBe(404);
        });
    });
});
