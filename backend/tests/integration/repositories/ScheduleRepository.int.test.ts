import { ScheduleRepository } from "@/repositories";
import { classSubjects, schedules } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { seeders, testDb, testDbManager } from "@test/utils";

describe("ScheduleRepository (integration)", () => {
    const repository = new ScheduleRepository(testDb);

    const subject = seededPrimaryData.subjects[0];
    const teacher = seededPrimaryData.teachers[0];

    let classSubject: typeof classSubjects.$inferInsert;
    let schedule: typeof schedules.$inferInsert;

    beforeAll(async () => {
        const session = seededPrimaryData.sessions[0];

        const clazz = await seeders.classes.seedOne({
            name: "Class 1",
            session: session.session,
            semester: session.semester,
        });

        classSubject = await seeders.classSubjects.seedOne({
            classId: clazz.id!,
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

    describe("findById", () => {
        it("should return the schedule with the specified ID", async () => {
            const scheduleDto = await repository.findById(schedule.id!);

            expect(scheduleDto).toMatchObject({
                id: schedule.id,
                classSubjectId: classSubject.id,
                day: ScheduleDay.monday,
                startTime: new Date(2024, 0, 1, 8).getTime(),
                endTime: new Date(2024, 0, 1, 9).getTime(),
                subject: {
                    code: subject.code,
                    name: subject.name,
                },
            });
        });

        it("should return null if the schedule with the specified ID does not exist", async () => {
            const scheduleDto = await repository.findById(999);

            expect(scheduleDto).toBeNull();
        });
    });

    describe("findByClassId", () => {
        it("should return the schedule for the class", async () => {
            const schedule = await repository.findByClassId(
                classSubject.classId,
            );

            expect(schedule).toHaveLength(1);
            expect(schedule[0]).toMatchObject({
                id: 1,
                day: ScheduleDay.monday,
                startTime: new Date(2024, 0, 1, 8).getTime(),
                endTime: new Date(2024, 0, 1, 9).getTime(),
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
                startTime: new Date(2024, 0, 1, 8).getTime(),
                endTime: new Date(2024, 0, 1, 9).getTime(),
            });
        });

        it("should return an empty array if the teacher has no schedule", async () => {
            const schedule = await repository.findByTeacherId(999);

            expect(schedule).toHaveLength(0);
        });
    });

    describe("hasConflict", () => {
        it("should return false for schedules that do not overlap in time or day", async () => {
            // Different day, no overlap.
            const diffDay = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.tuesday,
                new Date(2024, 0, 2, 8),
                new Date(2024, 0, 2, 9),
            );

            expect(diffDay).toBe(false);

            // Same day, strictly before (adjacent).
            const before = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 7),
                new Date(2024, 0, 1, 8),
            );

            expect(before).toBe(false);

            // Same day, strictly after (adjacent).
            const after = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 9),
                new Date(2024, 0, 1, 10),
            );

            expect(after).toBe(false);
        });

        it("should return true for partial and complete time overlaps", async () => {
            // Exact match.
            const exact = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 8),
                new Date(2024, 0, 1, 9),
            );

            expect(exact).toBe(true);

            // Starts before, ends during.
            const partialStart = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 7, 30),
                new Date(2024, 0, 1, 8, 30),
            );

            expect(partialStart).toBe(true);

            // Starts during, ends after.
            const partialEnd = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 8, 30),
                new Date(2024, 0, 1, 9, 30),
            );

            expect(partialEnd).toBe(true);

            // Complete engulfment.
            const engulfed = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 7),
                new Date(2024, 0, 1, 10),
            );

            expect(engulfed).toBe(true);
        });

        it("should return false when ignoring its own schedule ID (Update Scenario)", async () => {
            const result = await repository.hasConflict(
                classSubject.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 8, 30),
                new Date(2024, 0, 1, 9, 30),
                schedule.id,
            );

            expect(result).toBe(false);
        });

        it("should return true when a teacher is double-booked in a different class", async () => {
            const clazz2 = await seeders.classes.seedOne({
                name: "Class 2",
                session: seededPrimaryData.sessions[0].session,
                semester: seededPrimaryData.sessions[0].semester,
            });

            // Assign the same teacher to the new class.
            const classSubject2 = await seeders.classSubjects.seedOne({
                classId: clazz2.id!,
                subjectId: seededPrimaryData.subjects[0].id,
                teacherId: teacher.userId,
            });

            // Schedule class 2 at the exact same time as class 1.
            const result = await repository.hasConflict(
                classSubject2.id!,
                ScheduleDay.monday,
                new Date(2024, 0, 1, 8),
                new Date(2024, 0, 1, 9),
            );

            expect(result).toBe(true);
        });
    });

    describe("Write Operations (create, update, delete)", () => {
        let newScheduleId: number;

        it("should create a new schedule", async () => {
            // Save the ID for next tests.
            newScheduleId = await repository.create(
                classSubject.id!,
                ScheduleDay.wednesday,
                new Date(2024, 0, 3, 10),
                new Date(2024, 0, 3, 11),
            );

            // Fetch to verify insertion.
            const created = await repository.findById(newScheduleId);

            expect(created).toBeDefined();
            expect(created?.startTime).toBe(new Date(2024, 0, 3, 10).getTime());
        });

        it("should update an existing schedule", async () => {
            await repository.update(
                newScheduleId,
                ScheduleDay.thursday,
                new Date(2024, 0, 4, 13),
                new Date(2024, 0, 4, 15),
            );

            const updated = await repository.findById(newScheduleId);

            expect(updated?.day).toBe(ScheduleDay.thursday);
            expect(updated?.startTime).toBe(new Date(2024, 0, 4, 13).getTime());
        });

        it("should delete a schedule", async () => {
            await repository.delete(newScheduleId);

            const schedules = await repository.findByClassId(
                classSubject.classId,
            );

            const deleted = schedules.find((s) => s.id === newScheduleId);

            expect(deleted).toBeUndefined();
        });
    });
});
