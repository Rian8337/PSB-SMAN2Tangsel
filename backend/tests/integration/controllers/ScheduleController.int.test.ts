import { classSubjects, schedules } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("ScheduleController (integration)", () => {
    const student = seededPrimaryData.students[0];
    const teacher = seededPrimaryData.teachers[0];

    let classSubject: typeof classSubjects.$inferInsert;
    let schedule: typeof schedules.$inferInsert;

    beforeAll(async () => {
        const session = seededPrimaryData.sessions[0];
        const subject = seededPrimaryData.subjects[0];

        const clazz = await seeders.classes.seedOne({
            id: 1,
            name: "Test Class",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: clazz.id!,
            studentId: student.userId,
        });

        classSubject = await seeders.classSubjects.seedOne({
            id: 1,
            classId: clazz.id!,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        schedule = await seeders.schedules.seedOne({
            id: 1,
            classSubjectId: classSubject.id!,
            day: ScheduleDay.Monday,
            startTime: new Date(2024, 0, 1, 8),
            endTime: new Date(2024, 0, 1, 9),
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/schedule/${schedule.id!.toString()}`;
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

        it("should return the schedule if user is an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: schedule.id,
                classSubjectId: classSubject.id,
                day: ScheduleDay.Monday,
                startTime: schedule.startTime.getTime(),
                endTime: schedule.endTime.getTime(),
            });
        });
    });

    describe("GET /schedule", () => {
        const endpoint = "/schedule";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return the student's schedule", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(1);

            expect((res.body as (typeof schedule)[])[0].day).toBe(
                ScheduleDay.Monday,
            );
        });

        it("should return the teacher's schedule", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(1);

            expect((res.body as (typeof schedule)[])[0].day).toBe(
                ScheduleDay.Monday,
            );
        });

        it("should return 403 if user is an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });
    });

    describe("POST /schedule", () => {
        const endpoint = "/schedule";
        let payload: object;

        beforeAll(() => {
            payload = {
                classSubjectId: classSubject.id!,
                day: ScheduleDay.Wednesday,
                startTime: new Date(2024, 0, 3, 10).getTime(),
                endTime: new Date(2024, 0, 3, 11).getTime(),
            };
        });

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

        it("should return 201 if user is an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(201);
        });
    });

    describe("PUT /schedule/:id", () => {
        let endpoint: string;

        const payload = {
            day: ScheduleDay.Monday,
            // Shift schedule by 30 minutes.
            startTime: new Date(2024, 0, 1, 8, 30).getTime(),
            endTime: new Date(2024, 0, 1, 9, 30).getTime(),
        };

        beforeAll(() => {
            endpoint = `/schedule/${schedule.id!.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).put(endpoint).send(payload);
            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.put(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.put(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 200 if user is an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.put(endpoint).send(payload);
            expect(res.status).toBe(200);
        });
    });

    describe("DELETE /schedule/:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/schedule/${schedule.id!.toString()}`;
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

        it("should return 204 if user is an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(204);
        });
    });
});
