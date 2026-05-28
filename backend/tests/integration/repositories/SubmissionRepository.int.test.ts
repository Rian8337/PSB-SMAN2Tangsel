import { SubmissionRepository } from "@/repositories/SubmissionRepository";
import { seededPrimaryData } from "@psb/shared/tests";
import { seeders, testDb, testDbManager } from "@test/utils";

describe("SubmissionRepository (integration)", () => {
    const repository = new SubmissionRepository(testDb);

    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];

    let assignmentId: number;

    beforeAll(async () => {
        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-SR",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: cls.id!,
            studentId: student.id,
        });

        const classSubject = await seeders.classSubjects.seedOne({
            classId: cls.id!,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        const assignment = await seeders.assignments.seedOne({
            classSubjectId: classSubject.id!,
            title: "Test Assignment SR",
            visible: true,
        });

        assignmentId = assignment.id!;
    });

    afterAll(async () => {
        await testDbManager.cleanupSecondaryTables();
    });

    describe("getForAssignment", () => {
        it("should return an empty array when no submissions exist", async () => {
            const result = await repository.getForAssignment(assignmentId);

            expect(result).toEqual([]);
        });

        it("should return submission rows for all students who submitted", async () => {
            await seeders.assignmentSubmissions.seedOne({
                assignmentId,
                studentId: student.id,
            });

            const result = await repository.getForAssignment(assignmentId);

            expect(result).toHaveLength(1);
            expect(result[0].studentId).toBe(student.id);
            expect(result[0].studentIdentifier).toBe(student.identifier);
            expect(result[0].studentName).toBe(student.name);
            expect(typeof result[0].submittedAt).toBe("string");
            expect(() => new Date(result[0].submittedAt)).not.toThrow();
        });

        it("should return an empty array for an assignment with no submissions", async () => {
            const otherAssignment = await seeders.assignments.seedOne({
                classSubjectId: (
                    await seeders.classSubjects.seedOne({
                        classId: (
                            await seeders.classes.seedOne({
                                name: "XI-IPA-SR2",
                                session: session.session,
                                semester: session.semester,
                            })
                        ).id!,
                        subjectId: subject.id,
                        teacherId: teacher.userId,
                    })
                ).id!,
                title: "Another Assignment SR",
                visible: true,
            });

            const result = await repository.getForAssignment(
                otherAssignment.id!,
            );

            expect(result).toEqual([]);
        });
    });
});
