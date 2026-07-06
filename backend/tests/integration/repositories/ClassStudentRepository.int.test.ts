import { ClassStudentRepository } from "@/repositories";
import { studentClasses, users } from "@psb/shared/schema";
import { seededPrimaryData, testPassword } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { seeders, testDb, testDbManager } from "@test/utils";
import { and, eq, inArray } from "drizzle-orm";

describe("ClassStudentRepository (integration)", () => {
    const repository = new ClassStudentRepository(testDb);
    const sessionInfo = seededPrimaryData.sessions[0];

    let readOnlyClassId: number;
    let mutableClassId: number;

    let enrolledStudentUserId: number;
    let unenrolledStudentUserId: number;
    let inactiveStudentUserId: number;

    beforeAll(async () => {
        const readOnlyClass = await seeders.classes.seedOne({
            name: "Read-Only Student Class",
            session: sessionInfo.session,
            semester: sessionInfo.semester,
        });

        readOnlyClassId = readOnlyClass.id!;

        const mutableClass = await seeders.classes.seedOne({
            name: "Mutable Student Class",
            session: sessionInfo.session,
            semester: sessionInfo.semester,
        });

        mutableClassId = mutableClass.id!;

        const enrolledUser = await seeders.users.seedOne({
            identifier: "0012345680",
            name: "Enrolled Student",
            role: UserRole.Student,
            active: true,
            password: testPassword,
        });

        await seeders.students.seedOne({ userId: enrolledUser.id! });

        enrolledStudentUserId = enrolledUser.id!;

        const unenrolledUser = await seeders.users.seedOne({
            identifier: "0012345681",
            name: "Unenrolled Student",
            role: UserRole.Student,
            active: true,
            password: testPassword,
        });

        await seeders.students.seedOne({ userId: unenrolledUser.id! });

        unenrolledStudentUserId = unenrolledUser.id!;

        const inactiveUser = await seeders.users.seedOne({
            identifier: "0012345682",
            name: "Inactive Student",
            role: UserRole.Student,
            active: false,
            password: testPassword,
        });

        await seeders.students.seedOne({ userId: inactiveUser.id! });

        inactiveStudentUserId = inactiveUser.id!;

        await seeders.studentClasses.seedOne({
            classId: readOnlyClassId,
            studentId: enrolledStudentUserId,
        });
    });

    afterAll(async () => {
        await testDbManager.cleanupSecondaryTables();

        await testDb
            .delete(users)
            .where(
                inArray(users.id, [
                    enrolledStudentUserId,
                    unenrolledStudentUserId,
                    inactiveStudentUserId,
                ]),
            );
    });

    describe("getEnrolledStudents", () => {
        it("should return students currently enrolled in the class", async () => {
            const enrolled =
                await repository.getEnrolledStudents(readOnlyClassId);

            expect(enrolled.length).toBeGreaterThanOrEqual(1);

            expect(enrolled.some((s) => s.id === enrolledStudentUserId)).toBe(
                true,
            );
        });

        it("should return an empty array if the class has no students", async () => {
            const enrolled =
                await repository.getEnrolledStudents(mutableClassId);

            expect(enrolled).toHaveLength(0);
        });
    });

    describe("getUnenrolledStudents", () => {
        it("should return active students who are NOT enrolled in the target session/semester", async () => {
            const unenrolled = await repository.getUnenrolledStudents(
                sessionInfo.session,
                sessionInfo.semester,
            );

            expect(
                unenrolled.some((s) => s.id === unenrolledStudentUserId),
            ).toBe(true);

            expect(unenrolled.some((s) => s.id === enrolledStudentUserId)).toBe(
                false,
            );

            expect(unenrolled.some((s) => s.id === inactiveStudentUserId)).toBe(
                false,
            );
        });
    });

    describe("findActiveEnrollment", () => {
        it("should return the class details if the student is currently enrolled", async () => {
            const activeEnrollment = await repository.findActiveEnrollment(
                enrolledStudentUserId,
                sessionInfo.session,
                sessionInfo.semester,
            );

            expect(activeEnrollment).toBeDefined();
            expect(activeEnrollment?.id).toBe(readOnlyClassId);
            expect(activeEnrollment?.session).toBe(sessionInfo.session);
        });

        it("should return null if the student has no active enrollment for the period", async () => {
            const activeEnrollment = await repository.findActiveEnrollment(
                unenrolledStudentUserId,
                sessionInfo.session,
                sessionInfo.semester,
            );

            expect(activeEnrollment).toBeNull();
        });
    });

    describe("enrollStudent", () => {
        it("should insert a new class-student assignment into the database", async () => {
            await repository.enrollStudent(
                mutableClassId,
                unenrolledStudentUserId,
            );

            const dbRecords = await testDb
                .select()
                .from(studentClasses)
                .where(
                    and(
                        eq(studentClasses.classId, mutableClassId),
                        eq(studentClasses.studentId, unenrolledStudentUserId),
                    ),
                );

            expect(dbRecords).toHaveLength(1);
            expect(dbRecords[0].classId).toBe(mutableClassId);
            expect(dbRecords[0].studentId).toBe(unenrolledStudentUserId);
        });
    });

    describe("unenrollStudent", () => {
        it("should delete the enrollment from the database safely based on the hierarchy", async () => {
            await repository.unenrollStudent(
                readOnlyClassId,
                enrolledStudentUserId,
            );

            const dbRecords = await testDb
                .select()
                .from(studentClasses)
                .where(
                    and(
                        eq(studentClasses.classId, readOnlyClassId),
                        eq(studentClasses.studentId, enrolledStudentUserId),
                    ),
                );

            expect(dbRecords).toHaveLength(0);
        });
    });

    describe("hasEnrollments", () => {
        it("should return false when the student has no enrollment record", async () => {
            const result = await repository.hasEnrollments(
                inactiveStudentUserId,
            );

            expect(result).toBe(false);
        });

        it("should return true when the student has an enrollment record", async () => {
            const result = await repository.hasEnrollments(
                unenrolledStudentUserId,
            );

            expect(result).toBe(true);
        });
    });
});
