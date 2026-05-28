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
    const student2 = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[1].userId,
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

    describe("getForAssignmentWithAttachments", () => {
        it("should return an empty array when no submissions with attachments exist", async () => {
            const emptyAssignment = await seeders.assignments.seedOne({
                classSubjectId: (
                    await seeders.classSubjects.seedOne({
                        classId: (
                            await seeders.classes.seedOne({
                                name: "XI-IPA-SR-WA",
                                session: session.session,
                                semester: session.semester,
                            })
                        ).id!,
                        subjectId: subject.id,
                        teacherId: teacher.userId,
                    })
                ).id!,
                title: "Empty WA Assignment SR",
                visible: true,
            });

            const result = await repository.getForAssignmentWithAttachments(
                emptyAssignment.id!,
            );

            expect(result).toEqual([]);
        });

        it("should return rows with correct fields after seeding a submission with an attachment", async () => {
            const attachment = await seeders.attachments.seedOne({
                name: "test_submission.txt",
                path: "submission_test_sr.txt",
            });

            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId,
                studentId: student.id,
            });

            await seeders.assignmentSubmissionAttachments.seedOne({
                submissionId: submission.id!,
                attachmentId: attachment.id!,
            });

            const result = await repository.getForAssignmentWithAttachments(
                assignmentId,
            );

            const row = result.find(
                (r) => r.attachmentPath === attachment.path,
            );
            expect(row).toBeDefined();
            expect(row!.studentName).toBe(student.name);
            expect(row!.studentIdentifier).toBe(student.identifier);
            expect(row!.attachmentName).toBe(attachment.name);
            expect(row!.attachmentPath).toBe(attachment.path);
        });

        it("should filter results by studentId when provided", async () => {
            const cls2 = await seeders.classes.seedOne({
                name: "XI-IPA-SR-Filter",
                session: session.session,
                semester: session.semester,
            });

            await seeders.studentClasses.seedOne({
                classId: cls2.id!,
                studentId: student.id,
            });

            await seeders.studentClasses.seedOne({
                classId: cls2.id!,
                studentId: student2.id,
            });

            const classSubject2 = await seeders.classSubjects.seedOne({
                classId: cls2.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            const assignment2 = await seeders.assignments.seedOne({
                classSubjectId: classSubject2.id!,
                title: "Filter Test Assignment SR",
                visible: true,
            });

            const attachment1 = await seeders.attachments.seedOne({
                name: "student1_file.txt",
                path: "student1_sr_file.txt",
            });

            const attachment2 = await seeders.attachments.seedOne({
                name: "student2_file.txt",
                path: "student2_sr_file.txt",
            });

            const submission1 = await seeders.assignmentSubmissions.seedOne({
                assignmentId: assignment2.id!,
                studentId: student.id,
            });

            const submission2 = await seeders.assignmentSubmissions.seedOne({
                assignmentId: assignment2.id!,
                studentId: student2.id,
            });

            await seeders.assignmentSubmissionAttachments.seedOne({
                submissionId: submission1.id!,
                attachmentId: attachment1.id!,
            });

            await seeders.assignmentSubmissionAttachments.seedOne({
                submissionId: submission2.id!,
                attachmentId: attachment2.id!,
            });

            const allResults = await repository.getForAssignmentWithAttachments(
                assignment2.id!,
            );

            expect(allResults).toHaveLength(2);

            const filteredResults =
                await repository.getForAssignmentWithAttachments(
                    assignment2.id!,
                    student.id,
                );

            expect(filteredResults).toHaveLength(1);
            expect(filteredResults[0].studentName).toBe(student.name);
            expect(filteredResults[0].attachmentPath).toBe(attachment1.path);
        });
    });
});
