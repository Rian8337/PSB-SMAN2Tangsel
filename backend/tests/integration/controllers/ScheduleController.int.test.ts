import { schedules } from "@psb/shared/schema";
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

        const classSubject = await seeders.classSubjects.seedOne({
            id: 1,
            classId: clazz.id!,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        await seeders.schedules.seedOne({
            id: 1,
            classSubjectId: classSubject.id!,
            day: ScheduleDay.monday,
            startTime: new Date(2024, 0, 1, 8),
            endTime: new Date(2024, 0, 1, 9),
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /schedule", () => {
        const endpoint = "/schedule";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        describe("Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should return the student's schedule", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(1);
                expect(
                    (res.body as (typeof schedules.$inferSelect)[])[0].day,
                ).toBe(ScheduleDay.monday);
            });
        });

        describe("Teacher", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginTeacher(agent);
            });

            it("should return the teacher's schedule", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(200);
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body).toHaveLength(1);
                expect(
                    (res.body as (typeof schedules.$inferSelect)[])[0].day,
                ).toBe(ScheduleDay.monday);
            });
        });

        describe("Administrator", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginAdministrator(agent);
            });

            it("should restrict access", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(403);
            });
        });
    });
});
