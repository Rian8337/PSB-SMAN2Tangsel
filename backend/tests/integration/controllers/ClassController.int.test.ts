import { seededPrimaryData } from "@psb/shared/tests";
import { Class } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("ClassController (integration)", () => {
    let testClassId: number;
    let testClassToDeleteId: number;
    let testClassWithConflictId: number;

    const session = seededPrimaryData.sessions[0];
    const student = seededPrimaryData.students[0];

    beforeAll(async () => {
        const baseClass = await seeders.classes.seedOne({
            name: "X MIPA 1",
            session: session.session,
            semester: session.semester,
        });

        testClassId = baseClass.id!;

        const classToDelete = await seeders.classes.seedOne({
            name: "X MIPA 2",
            session: session.session,
            semester: session.semester,
        });

        testClassToDeleteId = classToDelete.id!;

        const classWithConflict = await seeders.classes.seedOne({
            name: "X MIPA 3",
            session: session.session,
            semester: session.semester,
        });

        testClassWithConflictId = classWithConflict.id!;

        await seeders.studentClasses.seedOne({
            classId: testClassWithConflictId,
            studentId: student.userId,
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /classes/list", () => {
        const endpoint = "/classes/list";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should restrict access", async () => {
                const res = await agent.get(endpoint);
                expect(res.status).toBe(403);
            });
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should return a list of classes", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as Class[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body.length).toBeGreaterThanOrEqual(1);

                const returnedClass = body.find((c) => c.id === testClassId);

                expect(returnedClass).toBeDefined();
                expect(returnedClass!.name).toBe("X MIPA 1");
            });

            it("should correctly apply search queries", async () => {
                const res = await agent.get(`${endpoint}?query=MIPA%201`);
                const body = res.body as Class[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);
                expect(body[0].name).toBe("X MIPA 1");
            });
        });
    });

    describe("POST /classes", () => {
        const endpoint = "/classes";

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should successfully create a new class", async () => {
                const res = await agent.post(endpoint).send({
                    name: "X IPS 1",
                    session: session.session,
                    semester: session.semester,
                });

                expect(res.status).toBe(201);

                // Verify insertion
                const listRes = await agent.get(
                    `${endpoint}/list?query=IPS%201`,
                );

                const body = listRes.body as Class[];

                expect(body).toBeInstanceOf(Array);
                expect(body[0].name).toBe("X IPS 1");
            });
        });
    });

    describe("PATCH /classes/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should update the class name", async () => {
                const res = await agent
                    .patch(`/classes/${testClassId.toString()}`)
                    .send({ name: "X MIPA 1 Updated" });

                expect(res.status).toBe(204);

                const getRes = await agent.get(
                    `/classes/${testClassId.toString()}`,
                );

                const getBody = getRes.body as Class;

                expect(getBody.name).toBe("X MIPA 1 Updated");
            });
        });
    });

    describe("DELETE /classes/:id", () => {
        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should delete an empty class successfully", async () => {
                const res = await agent.delete(
                    `/classes/${testClassToDeleteId.toString()}`,
                );

                expect(res.status).toBe(204);

                // Verify it's gone
                const getRes = await agent.get(
                    `/classes/${testClassToDeleteId.toString()}`,
                );

                expect(getRes.status).toBe(404);
            });

            it("should return 409 Conflict if class has enrolled students", async () => {
                const res = await agent.delete(
                    `/classes/${testClassWithConflictId.toString()}`,
                );

                expect(res.status).toBe(409);
            });
        });
    });
});
