import { ScheduleRepository } from "@/repositories";
import { classSubjects } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { seeders, testDb, testDbManager } from "@test/utils";

describe("ScheduleRepository (integration)", () => {
    const repository = new ScheduleRepository(testDb);
    const teacher = seededPrimaryData.teachers[0];
    let classSubject: typeof classSubjects.$inferInsert;

    beforeAll(async () => {
        const subject = seededPrimaryData.subjects[0];
        const session = seededPrimaryData.sessions[0];

        await seeders.classes.seedOne({
            id: 1,
            name: "Class 1",
            session: session.session,
            semester: session.semester,
        });

        classSubject = await seeders.classSubjects.seedOne({
            id: 1,
            classId: 1,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        await seeders.schedules.seedOne({
            id: 1,
            classSubjectId: classSubject.id!,
            day: ScheduleDay.monday,
            startTime: new Date("1970-01-01T08:00:00Z"),
            endTime: new Date("1970-01-01T09:00:00Z"),
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("findByClassId", () => {
        it("should return the schedule for the class", async () => {
            const schedule = await repository.findByClassId(
                classSubject.classId,
            );

            expect(schedule).toHaveLength(1);
            expect(schedule[0]).toMatchObject({
                id: 1,
                day: ScheduleDay.monday,
                startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                endTime: new Date("1970-01-01T09:00:00Z").getTime(),
            });
        });

        it("should return an empty array if the class has no schedule", async () => {
            const schedule = await repository.findByClassId(999);

            expect(schedule).toHaveLength(0);
        });
    });

    describe("findByTeacherId", () => {
        it("should return the schedule for the teacher", async () => {
            const schedule = await repository.findByTeacherId(teacher.userId);

            expect(schedule).toHaveLength(1);
            expect(schedule[0]).toMatchObject({
                id: 1,
                day: ScheduleDay.monday,
                startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                endTime: new Date("1970-01-01T09:00:00Z").getTime(),
            });
        });

        it("should return an empty array if the teacher has no schedule", async () => {
            const schedule = await repository.findByTeacherId(999);

            expect(schedule).toHaveLength(0);
        });
    });
});
