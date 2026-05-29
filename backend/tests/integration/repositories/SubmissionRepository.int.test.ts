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

    describe("getByStudent", () => {
        it("should return null when no submission exists for the student", async () => {
            const cls = await seeders.classes.seedOne({
                name: "XI-IPA-SR-GBS",
                session: session.session,
                semester: session.semester,
            });

            const classSubject = await seeders.classSubjects.seedOne({
                classId: cls.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            const assignment = await seeders.assignments.seedOne({
                classSubjectId: classSubject.id!,
                title: "GetByStudent Empty SR",
                visible: true,
            });

            const result = await repository.getByStudent(
                assignment.id!,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return the submission with attachments when it exists", async () => {
            const freshCls = await seeders.classes.seedOne({
                name: "XI-IPA-SR-GBS2",
                session: session.session,
                semester: session.semester,
            });

            await seeders.studentClasses.seedOne({
                classId: freshCls.id!,
                studentId: student.id,
            });

            const freshClassSubject = await seeders.classSubjects.seedOne({
                classId: freshCls.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            const freshAssignment = await seeders.assignments.seedOne({
                classSubjectId: freshClassSubject.id!,
                title: "GBS2 SR",
                visible: true,
            });

            const attachment = await seeders.attachments.seedOne({
                name: "gbs_file.txt",
                path: "gbs_sr_file.txt",
            });

            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId: freshAssignment.id!,
                studentId: student.id,
            });

            await seeders.assignmentSubmissionAttachments.seedOne({
                submissionId: submission.id!,
                attachmentId: attachment.id!,
            });

            const result = await repository.getByStudent(
                freshAssignment.id!,
                student.id,
            );

            expect(result).not.toBeNull();
            expect(result!.id).toBe(submission.id);
            expect(result!.attachments.some((a) => a.name === "gbs_file.txt")).toBe(true);
        });
    });

    describe("getAttachmentIds", () => {
        it("should return an empty array for a submission with no attachments", async () => {
            const cls = await seeders.classes.seedOne({
                name: "XI-IPA-SR-GAI",
                session: session.session,
                semester: session.semester,
            });

            const classSubject = await seeders.classSubjects.seedOne({
                classId: cls.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            const assignment = await seeders.assignments.seedOne({
                classSubjectId: classSubject.id!,
                title: "GetAttachmentIds SR",
                visible: true,
            });

            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId: assignment.id!,
                studentId: student.id,
            });

            const result = await repository.getAttachmentIds(submission.id!);

            expect(result).toEqual([]);
        });

        it("should return the attachment IDs for a submission", async () => {
            const attachment = await seeders.attachments.seedOne({
                name: "gai_file.txt",
                path: "gai_sr_file.txt",
            });

            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId,
                studentId: student.id,
            });

            await seeders.assignmentSubmissionAttachments.seedOne({
                submissionId: submission.id!,
                attachmentId: attachment.id!,
            });

            const result = await repository.getAttachmentIds(submission.id!);

            expect(result).toContain(attachment.id);
        });
    });

    describe("add", () => {
        it("should create a submission and return it with attachments", async () => {
            const cls = await seeders.classes.seedOne({
                name: "XI-IPA-SR-ADD",
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
                title: "Add Submission SR",
                visible: true,
            });

            const attachment = await seeders.attachments.seedOne({
                name: "add_file.txt",
                path: "add_sr_file.txt",
            });

            const result = await repository.add(
                assignment.id!,
                student.id,
                [attachment.id!],
            );

            expect(result.id).toBeTypeOf("number");
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].id).toBe(attachment.id);
            expect(result.attachments[0].name).toBe("add_file.txt");
        });
    });

    describe("addAttachments", () => {
        it("should link new attachments to an existing submission", async () => {
            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId,
                studentId: student.id,
            });

            const attachment = await seeders.attachments.seedOne({
                name: "addatt_file.txt",
                path: "addatt_sr_file.txt",
            });

            await repository.addAttachments(submission.id!, [attachment.id!]);

            const ids = await repository.getAttachmentIds(submission.id!);

            expect(ids).toContain(attachment.id);
        });
    });

    describe("delete", () => {
        it("should remove the submission from the database", async () => {
            const delCls = await seeders.classes.seedOne({
                name: "XI-IPA-SR-DEL",
                session: session.session,
                semester: session.semester,
            });

            await seeders.studentClasses.seedOne({
                classId: delCls.id!,
                studentId: student.id,
            });

            const delClassSubject = await seeders.classSubjects.seedOne({
                classId: delCls.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            const delAssignment = await seeders.assignments.seedOne({
                classSubjectId: delClassSubject.id!,
                title: "Delete SR",
                visible: true,
            });

            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId: delAssignment.id!,
                studentId: student.id,
            });

            await repository.delete(submission.id!);

            const result = await repository.getByStudent(
                delAssignment.id!,
                student.id,
            );

            expect(result).toBeNull();
        });
    });
});
