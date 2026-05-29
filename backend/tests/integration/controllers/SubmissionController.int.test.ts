import { seededPrimaryData } from "@psb/shared/tests";
import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
} from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import request from "supertest";

describe("SubmissionController (integration)", () => {
    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];

    const storagePath = process.env.STORAGE_PATH ?? "./tests/storage";
    const submissionAttachmentPath = "submission_test_sc.txt";
    const testFilePath = join(storagePath, submissionAttachmentPath);

    let assignmentId: number;
    let unownedAssignmentId: number;

    beforeAll(async () => {
        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-SC",
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
            title: "Test Assignment SC",
            visible: true,
        });

        assignmentId = assignment.id!;

        const submission = await seeders.assignmentSubmissions.seedOne({
            assignmentId,
            studentId: student.id,
        });

        const attachment = await seeders.attachments.seedOne({
            name: "test_submission_file.txt",
            path: submissionAttachmentPath,
        });

        await seeders.assignmentSubmissionAttachments.seedOne({
            submissionId: submission.id!,
            attachmentId: attachment.id!,
        });

        // An assignment that belongs to a different class subject with no teacher assigned.
        const unownedClass = await seeders.classes.seedOne({
            name: "Unowned Class SC",
            session: session.session,
            semester: session.semester,
        });

        const unownedClassSubject = await seeders.classSubjects.seedOne({
            classId: unownedClass.id!,
            subjectId: subject.id,
            teacherId: null,
        });

        const unownedAssignment = await seeders.assignments.seedOne({
            classSubjectId: unownedClassSubject.id!,
            title: "Unowned Assignment SC",
            visible: true,
        });

        unownedAssignmentId = unownedAssignment.id!;

        await mkdir(storagePath, { recursive: true });
        await writeFile(testFilePath, "test submission content");
    });

    afterAll(async () => {
        await rm(testFilePath, { force: true });
        await testDbManager.cleanupSecondaryTables();
    });

    describe("GET /assignments/:assignmentId/submissions", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/assignments/${assignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid assignment ID", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get("/assignments/abc/submissions");

            expect(res.status).toBe(400);
        });

        it("should return 200 with submission rows for an owned assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(200);

            const body = res.body as AssignmentSubmissionRow[];
            expect(body).toHaveLength(1);
            expect(body[0].studentId).toBe(student.id);
            expect(body[0].studentIdentifier).toBe(student.identifier);
            expect(body[0].studentName).toBe(student.name);
            expect(typeof body[0].submittedAt).toBe("string");
        });

        it("should return 404 when the teacher does not own the assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${unownedAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(404);
        });

        it("should return 200 with an empty array when no submissions exist", async () => {
            const extraAssignment = await seeders.assignments.seedOne({
                classSubjectId: (
                    await seeders.classSubjects.seedOne({
                        classId: (
                            await seeders.classes.seedOne({
                                name: "Empty SC",
                                session: session.session,
                                semester: session.semester,
                            })
                        ).id!,
                        subjectId: subject.id,
                        teacherId: teacher.userId,
                    })
                ).id!,
                title: "Empty Assignment SC",
                visible: true,
            });

            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${extraAssignment.id!.toString()}/submissions`,
            );

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("GET /assignments/:assignmentId/submissions/download", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/assignments/${assignmentId.toString()}/submissions/download`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions/download`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions/download`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid assignment ID", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                "/assignments/abc/submissions/download",
            );

            expect(res.status).toBe(400);
        });

        it("should return 400 for an invalid studentId query param", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions/download?studentId=abc`,
            );

            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher does not own the assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${unownedAssignmentId.toString()}/submissions/download`,
            );

            expect(res.status).toBe(404);
        });

        it("should return 200 with application/zip content type for an owned assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions/download`,
            );

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toContain("application/zip");
            expect(res.headers["content-disposition"]).toContain(
                `submissions-${assignmentId.toString()}.zip`,
            );
        });

        it("should return 200 with an empty zip when the assignment has no attachments", async () => {
            const noAttachAssignment = await seeders.assignments.seedOne({
                classSubjectId: (
                    await seeders.classSubjects.seedOne({
                        classId: (
                            await seeders.classes.seedOne({
                                name: "No Attach SC",
                                session: session.session,
                                semester: session.semester,
                            })
                        ).id!,
                        subjectId: subject.id,
                        teacherId: teacher.userId,
                    })
                ).id!,
                title: "No Attachment Assignment SC",
                visible: true,
            });

            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${noAttachAssignment.id!.toString()}/submissions/download`,
            );

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toContain("application/zip");
        });

        it("should return 200 when filtering by a valid studentId", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                `/assignments/${assignmentId.toString()}/submissions/download?studentId=${student.id.toString()}`,
            );

            expect(res.status).toBe(200);
            expect(res.headers["content-type"]).toContain("application/zip");
        });
    });

    describe("POST /assignments/:assignmentId/submissions", () => {
        let freshAssignmentId: number;

        afterEach(async () => {
            await rm(join(storagePath, "attachments"), {
                recursive: true,
                force: true,
            });
        });

        beforeAll(async () => {
            const cls = await seeders.classes.seedOne({
                name: "XI-IPA-SC-POST",
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
                title: "POST Test Assignment SC",
                visible: true,
            });

            freshAssignmentId = assignment.id!;
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).post(
                `/assignments/${freshAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.post(
                `/assignments/${freshAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.post(
                `/assignments/${freshAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid assignment ID", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.post("/assignments/abc/submissions");

            expect(res.status).toBe(400);
        });

        it("should return 201 with the submission on success", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .post(`/assignments/${freshAssignmentId.toString()}/submissions`)
                .attach("files", Buffer.from("content"), "file.txt");

            expect(res.status).toBe(201);

            const body = res.body as SubjectAssignmentSubmission;
            expect(body.id).toBeTypeOf("number");
            expect(body.attachments).toHaveLength(1);
            expect(body.attachments[0].name).toBe("file.txt");
        });

        it("should return 409 when the student already has a submission", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .post(`/assignments/${freshAssignmentId.toString()}/submissions`)
                .attach("files", Buffer.from("content"), "file2.txt");

            expect(res.status).toBe(409);
        });
    });

    describe("PUT /assignments/:assignmentId/submissions", () => {
        let updateAssignmentId: number;

        afterEach(async () => {
            await rm(join(storagePath, "attachments"), {
                recursive: true,
                force: true,
            });
        });

        beforeAll(async () => {
            const cls = await seeders.classes.seedOne({
                name: "XI-IPA-SC-PUT",
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
                title: "PUT Test Assignment SC",
                visible: true,
            });

            updateAssignmentId = assignment.id!;

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: updateAssignmentId,
                studentId: student.id,
            });
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).put(
                `/assignments/${updateAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.put(
                `/assignments/${updateAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid assignment ID", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.put("/assignments/abc/submissions");

            expect(res.status).toBe(400);
        });

        it("should return 200 on success", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .put(`/assignments/${updateAssignmentId.toString()}/submissions`)
                .field("deletedAttachmentIds", JSON.stringify([]))
                .field("renamedAttachments", JSON.stringify([]))
                .attach("files", Buffer.from("new content"), "new.txt");

            expect(res.status).toBe(200);
        });

        it("should return 404 when the student has no submission", async () => {
            const noSubClass = await seeders.classes.seedOne({
                name: "NoSub SC",
                session: session.session,
                semester: session.semester,
            });

            await seeders.studentClasses.seedOne({
                classId: noSubClass.id!,
                studentId: student.id,
            });

            const noSubClassSubject = await seeders.classSubjects.seedOne({
                classId: noSubClass.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            const noSubAssignment = await seeders.assignments.seedOne({
                classSubjectId: noSubClassSubject.id!,
                title: "No Sub Assignment SC",
                visible: true,
            });

            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .put(
                    `/assignments/${noSubAssignment.id!.toString()}/submissions`,
                )
                .field("deletedAttachmentIds", JSON.stringify([]))
                .field("renamedAttachments", JSON.stringify([]));

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /assignments/:assignmentId/submissions", () => {
        let deleteAssignmentId: number;

        beforeAll(async () => {
            const cls = await seeders.classes.seedOne({
                name: "XI-IPA-SC-DELETE",
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
                title: "DELETE Test Assignment SC",
                visible: true,
            });

            deleteAssignmentId = assignment.id!;

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: deleteAssignmentId,
                studentId: student.id,
            });
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).delete(
                `/assignments/${deleteAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(
                `/assignments/${deleteAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid assignment ID", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete("/assignments/abc/submissions");

            expect(res.status).toBe(400);
        });

        it("should return 204 on success", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(
                `/assignments/${deleteAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(204);
        });

        it("should return 404 when the student has no submission", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(
                `/assignments/${deleteAssignmentId.toString()}/submissions`,
            );

            expect(res.status).toBe(404);
        });
    });
});
