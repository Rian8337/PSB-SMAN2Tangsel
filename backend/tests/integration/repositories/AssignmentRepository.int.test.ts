import { AssignmentRepository } from "@/repositories/AssignmentRepository";
import { seededPrimaryData } from "@psb/shared/tests";
import { seeders, testDb, testDbManager } from "@test/utils";

describe("AssignmentRepository (integration)", () => {
    const repository = new AssignmentRepository(testDb);

    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];
    const seededAttachment = seededPrimaryData.attachments[0];

    let classSubjectId: number;
    let visibleAssignmentId: number;
    let hiddenAssignmentId: number;

    beforeAll(async () => {
        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-1",
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

        classSubjectId = classSubject.id!;

        const visibleAssignment = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Visible Assignment",
            description: "A visible assignment",
            visible: true,
        });

        visibleAssignmentId = visibleAssignment.id!;

        const hiddenAssignment = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Hidden Assignment",
            description: null,
            visible: false,
        });

        hiddenAssignmentId = hiddenAssignment.id!;

        await seeders.assignmentAttachments.seedOne({
            assignmentId: visibleAssignmentId,
            attachmentId: seededAttachment.id,
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("getStudentAssignment", () => {
        it("should return null when the student is not enrolled in the class", async () => {
            const result = await repository.getStudentAssignment(
                visibleAssignmentId,
                seededPrimaryData.students[1].userId,
            );

            expect(result).toBeNull();
        });

        it("should return null for a hidden assignment even when the student is enrolled", async () => {
            const result = await repository.getStudentAssignment(
                hiddenAssignmentId,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return the assignment with attachments and null submission for an enrolled student with no submission", async () => {
            const result = (await repository.getStudentAssignment(
                visibleAssignmentId,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.id).toBe(visibleAssignmentId);
            expect(result.classSubjectId).toBe(classSubjectId);
            expect(result.title).toBe("Visible Assignment");
            expect(result.description).toBe("A visible assignment");
            expect(result.subject.id).toBe(subject.id);
            expect(result.subject.code).toBe(subject.code);
            expect(result.subject.name).toBe(subject.name);
            expect(typeof result.createdAt).toBe("string");
            expect(typeof result.lastUpdatedAt).toBe("string");
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].id).toBe(seededAttachment.id);
            expect(result.attachments[0].name).toBe(seededAttachment.name);
            expect(result.attachments[0].downloadCount).toBe(0);
            expect(result.submission).toBeNull();
        });

        it("should reflect the correct download count after downloads are recorded", async () => {
            const countAttachment = await seeders.attachments.seedOne({
                name: "Download Count Attachment",
                path: "assignment_download_count_attachment.txt",
            });

            const countAssignment = await seeders.assignments.seedOne({
                classSubjectId,
                title: "Download Count Assignment",
                visible: true,
            });

            await seeders.assignmentAttachments.seedOne({
                assignmentId: countAssignment.id!,
                attachmentId: countAttachment.id!,
            });

            await seeders.attachmentDownloads.seedOne({
                attachmentId: countAttachment.id!,
                userId: student.id,
            });

            await seeders.attachmentDownloads.seedOne({
                attachmentId: countAttachment.id!,
                userId: student.id,
            });

            const result = (await repository.getStudentAssignment(
                countAssignment.id!,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].downloadCount).toBe(2);
        });

        it("should return the assignment with no attachments for an assignment without attachments", async () => {
            const noAttachmentAssignment = await seeders.assignments.seedOne({
                classSubjectId,
                title: "No Attachment Assignment",
                visible: true,
            });

            const result = (await repository.getStudentAssignment(
                noAttachmentAssignment.id!,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.attachments).toHaveLength(0);
            expect(result.submission).toBeNull();
        });

        it("should include the student submission when the student has submitted", async () => {
            const submission = await seeders.assignmentSubmissions.seedOne({
                assignmentId: visibleAssignmentId,
                studentId: student.id,
            });

            const submissionAttachment = await seeders.attachments.seedOne({
                name: "Submission File",
                path: "submission_file.pdf",
            });

            await seeders.assignmentSubmissionAttachments.seedOne({
                submissionId: submission.id!,
                attachmentId: submissionAttachment.id!,
            });

            const result = (await repository.getStudentAssignment(
                visibleAssignmentId,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.submission).not.toBeNull();
            expect(result.submission!.id).toBe(submission.id);
            expect(typeof result.submission!.submittedAt).toBe("string");
            expect(result.submission!.attachments).toHaveLength(1);
            expect(result.submission!.attachments[0].name).toBe(
                "Submission File",
            );
        });
    });

    describe("getTeacherAssignment", () => {
        it("should return null when the teacher is not assigned to the class subject", async () => {
            const result = await repository.getTeacherAssignment(
                visibleAssignmentId,
                seededPrimaryData.students[0].userId,
            );

            expect(result).toBeNull();
        });

        it("should return a visible assignment for an assigned teacher", async () => {
            const result = (await repository.getTeacherAssignment(
                visibleAssignmentId,
                teacher.userId,
            ))!;

            expect(result).not.toBeNull();
            expect(result.id).toBe(visibleAssignmentId);
            expect(result.classSubjectId).toBe(classSubjectId);
            expect(result.visible).toBe(true);
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].downloadCount).toBe(0);
        });

        it("should return a hidden assignment for an assigned teacher", async () => {
            const result = await repository.getTeacherAssignment(
                hiddenAssignmentId,
                teacher.userId,
            );

            expect(result).not.toBeNull();
            expect(result!.id).toBe(hiddenAssignmentId);
            expect(result!.visible).toBe(false);
            expect(result!.attachments).toHaveLength(0);
        });

        it("should reflect the correct download count after downloads are recorded", async () => {
            const countAttachment = await seeders.attachments.seedOne({
                name: "Teacher Download Count Attachment",
                path: "assignment_teacher_download_count_attachment.txt",
            });

            const countAssignment = await seeders.assignments.seedOne({
                classSubjectId,
                title: "Teacher Download Count Assignment",
                visible: true,
            });

            await seeders.assignmentAttachments.seedOne({
                assignmentId: countAssignment.id!,
                attachmentId: countAttachment.id!,
            });

            await seeders.attachmentDownloads.seedOne({
                attachmentId: countAttachment.id!,
                userId: teacher.userId,
            });

            await seeders.attachmentDownloads.seedOne({
                attachmentId: countAttachment.id!,
                userId: student.id,
            });

            const result = (await repository.getTeacherAssignment(
                countAssignment.id!,
                teacher.userId,
            ))!;

            expect(result).not.toBeNull();
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].downloadCount).toBe(2);
        });
    });

    describe("getStudentAttachment", () => {
        it("should return null when the attachment does not belong to the assignment", async () => {
            const result = await repository.getStudentAttachment(
                visibleAssignmentId,
                99999,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return null for an attachment on a hidden assignment", async () => {
            const extraAttachment = await seeders.attachments.seedOne({
                name: "Hidden Assignment Attachment",
                path: "hidden_assignment_attachment.txt",
            });

            await seeders.assignmentAttachments.seedOne({
                assignmentId: hiddenAssignmentId,
                attachmentId: extraAttachment.id!,
            });

            const result = await repository.getStudentAttachment(
                hiddenAssignmentId,
                extraAttachment.id!,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return the attachment path and name for an enrolled student on a visible assignment", async () => {
            const result = await repository.getStudentAttachment(
                visibleAssignmentId,
                seededAttachment.id,
                student.id,
            );

            expect(result).not.toBeNull();
            expect(result!.path).toBe(seededAttachment.path);
            expect(result!.name).toBe(seededAttachment.name);
        });
    });

    describe("getTeacherAttachment", () => {
        it("should return null when the attachment does not belong to the assignment", async () => {
            const result = await repository.getTeacherAttachment(
                visibleAssignmentId,
                99999,
                teacher.userId,
            );

            expect(result).toBeNull();
        });

        it("should return the attachment for a hidden assignment when the teacher is assigned", async () => {
            const extraAttachment = await seeders.attachments.seedOne({
                name: "Teacher Hidden Attachment",
                path: "teacher_hidden_attachment.txt",
            });

            await seeders.assignmentAttachments.seedOne({
                assignmentId: hiddenAssignmentId,
                attachmentId: extraAttachment.id!,
            });

            const result = await repository.getTeacherAttachment(
                hiddenAssignmentId,
                extraAttachment.id!,
                teacher.userId,
            );

            expect(result).not.toBeNull();
            expect(result!.path).toBe("teacher_hidden_attachment.txt");
        });

        it("should return null when the teacher is not assigned to the class subject", async () => {
            const result = await repository.getTeacherAttachment(
                visibleAssignmentId,
                seededAttachment.id,
                seededPrimaryData.students[0].userId,
            );

            expect(result).toBeNull();
        });
    });
});
