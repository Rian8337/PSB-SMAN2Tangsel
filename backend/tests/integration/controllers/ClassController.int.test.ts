import { schedules } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import { Class, ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("ClassController (integration)", () => {
    let testClassId: number;
    let testClassToDeleteId: number;
    let testClassWithConflictId: number;
    let schedule: typeof schedules.$inferInsert;

    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.students[0];
    const teacher = seededPrimaryData.teachers[0];

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

        const classSubject = await seeders.classSubjects.seedOne({
            classId: testClassId,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        schedule = await seeders.schedules.seedOne({
            classSubjectId: classSubject.id!,
            day: ScheduleDay.monday,
            startTime: new Date(2024, 0, 1, 8),
            endTime: new Date(2024, 0, 1, 9),
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /classes/:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${testClassId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return class details for administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            const body = res.body as Class;

            expect(res.status).toBe(200);
            expect(body).toBeDefined();
            expect(body.id).toBe(testClassId);
            expect(body.name).toBe("X MIPA 1");
        });
    });

    describe("GET /classes/list", () => {
        const endpoint = "/classes/list";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
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

    describe("GET /classes/:id/schedules", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${testClassId.toString()}/schedules`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return the class schedule for administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            const body = res.body as ScheduleDTO[];

            expect(res.status).toBe(200);

            expect(body).toBeInstanceOf(Array);
            expect(body).toHaveLength(1);
            expect(body[0].id).toBe(schedule.id);
            expect(body[0].day).toBe(ScheduleDay.monday);
        });
    });

    describe("POST /classes", () => {
        const endpoint = "/classes";

        const payload = {
            name: "X IPS 1",
            session: session.session,
            semester: session.semester,
        };

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).post(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should successfully create a new class", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.post(endpoint).send({
                name: "X IPS 1",
                session: session.session,
                semester: session.semester,
            });

            expect(res.status).toBe(201);

            // Verify insertion
            const listRes = await agent.get(`${endpoint}/list?query=IPS%201`);
            const body = listRes.body as Class[];

            expect(body).toBeInstanceOf(Array);
            expect(body[0].name).toBe("X IPS 1");
        });
    });

    describe("PATCH /classes/:id", () => {
        let endpoint: string;
        const payload = { name: "X MIPA 1 Updated" };

        beforeAll(() => {
            endpoint = `/classes/${testClassId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).patch(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should update the class name", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(204);

            const getRes = await agent.get(
                `/classes/${testClassId.toString()}`,
            );

            const getBody = getRes.body as Class;

            expect(getBody.name).toBe("X MIPA 1 Updated");
        });
    });

    describe("DELETE /classes/:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${testClassToDeleteId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).delete(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(403);
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should delete an empty class successfully", async () => {
                const res = await agent.delete(endpoint);
                expect(res.status).toBe(204);

                // Verify it's gone
                const getRes = await agent.get(endpoint);
                expect(getRes.status).toBe(404);
            });

            it("should return 409 if class has enrolled students", async () => {
                const res = await agent.delete(
                    `/classes/${testClassWithConflictId.toString()}`,
                );

                expect(res.status).toBe(409);
            });
        });
    });
});
