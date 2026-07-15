import { seededPrimaryData } from "@psb/shared/tests";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
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

describe("AssignmentController (integration)", () => {
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
    let unassignedAssignmentId: number;
    let downloadAttachmentId: number;

    const storagePath = process.env.STORAGE_PATH ?? "./tests/storage";

    // Use a separate file path to avoid race conditions with MaterialController tests
    // that share the same filesystem storage directory.
    const assignmentAttachmentPath = "assignment_test_attachment.txt";
    const testFilePath = join(storagePath, assignmentAttachmentPath);

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

        // Seed a separate attachment with a unique file path for download tests to avoid
        // filesystem race conditions with MaterialController tests that use the same storage dir.
        const downloadAttachment = await seeders.attachments.seedOne({
            name: "Assignment Download Attachment",
            path: assignmentAttachmentPath,
        });

        downloadAttachmentId = downloadAttachment.id!;

        await seeders.assignmentAttachments.seedOne({
            assignmentId: visibleAssignmentId,
            attachmentId: downloadAttachmentId,
        });

        // Class subject with no teacher — used to test 404 for unassigned teacher.
        const unassignedClass = await seeders.classes.seedOne({
            name: "Unassigned Class",
            session: session.session,
            semester: session.semester,
        });

        const unassignedClassSubject = await seeders.classSubjects.seedOne({
            classId: unassignedClass.id!,
            subjectId: subject.id,
            teacherId: null,
        });

        const unassignedAssignment = await seeders.assignments.seedOne({
            classSubjectId: unassignedClassSubject.id!,
            title: "Unassigned Assignment",
            visible: true,
        });

        unassignedAssignmentId = unassignedAssignment.id!;

        await mkdir(storagePath, { recursive: true });
        await writeFile(testFilePath, "test attachment content");
    });

    afterAll(async () => {
        await rm(testFilePath, { force: true });
        await testDbManager.cleanupSecondaryTables();
    });

    describe("GET /assignments/:id", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/assignments/${visibleAssignmentId.toString()}`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/assignments/${visibleAssignmentId.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid ID format", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get("/assignments/abc");

            expect(res.status).toBe(400);
        });

        describe("as a student", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginStudent(agent);
            });

            it("should return 200 with the assignment for an enrolled student viewing a visible assignment", async () => {
                const res = await agent.get(
                    `/assignments/${visibleAssignmentId.toString()}`,
                );

                expect(res.status).toBe(200);

                const body = res.body as StudentSubjectAssignment;
                expect(body.id).toBe(visibleAssignmentId);
                expect(body.classSubjectId).toBe(classSubjectId);
                expect(body.title).toBe("Visible Assignment");
                expect(body.subject.id).toBe(subject.id);
                expect(body.attachments).toHaveLength(2);
                expect(body.attachments[0].id).toBe(seededAttachment.id);
                expect(body.submission).toBeNull();
            });

            it("should return 404 for a hidden assignment", async () => {
                const res = await agent.get(
                    `/assignments/${hiddenAssignmentId.toString()}`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 when the student is not enrolled in the class", async () => {
                const res = await agent.get(
                    `/assignments/${unassignedAssignmentId.toString()}`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 for a non-existent assignment ID", async () => {
                const res = await agent.get("/assignments/99999");

                expect(res.status).toBe(404);
            });
        });

        describe("as a teacher", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginTeacher(agent);
            });

            it("should return 200 for a visible assignment in an assigned class subject", async () => {
                const res = await agent.get(
                    `/assignments/${visibleAssignmentId.toString()}`,
                );

                expect(res.status).toBe(200);

                const body = res.body as TeacherSubjectAssignment;
                expect(body.id).toBe(visibleAssignmentId);
                expect(body.visible).toBe(true);
                expect(body.attachments).toHaveLength(2);
            });

            it("should return 200 for a hidden assignment in an assigned class subject", async () => {
                const res = await agent.get(
                    `/assignments/${hiddenAssignmentId.toString()}`,
                );

                expect(res.status).toBe(200);

                const body = res.body as TeacherSubjectAssignment;
                expect(body.id).toBe(hiddenAssignmentId);
                expect(body.visible).toBe(false);
            });

            it("should return 404 when the teacher is not assigned to the class subject", async () => {
                const res = await agent.get(
                    `/assignments/${unassignedAssignmentId.toString()}`,
                );

                expect(res.status).toBe(404);
            });
        });
    });

    describe("GET /assignments/:assignmentId/attachments/:attachmentId", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/assignments/${visibleAssignmentId.toString()}/attachments/${seededAttachment.id.toString()}`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/assignments/${visibleAssignmentId.toString()}/attachments/${seededAttachment.id.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it.each([
            { assignmentId: "abc", attachmentId: "1" },
            { assignmentId: "0", attachmentId: "1" },
            { assignmentId: "1", attachmentId: "abc" },
            { assignmentId: "1", attachmentId: "-1" },
        ])(
            "should return 400 for invalid IDs: assignmentId=$assignmentId, attachmentId=$attachmentId",
            async ({ assignmentId, attachmentId }) => {
                const agent = request.agent(app);
                await loginStudent(agent);

                const res = await agent.get(
                    `/assignments/${assignmentId}/attachments/${attachmentId}`,
                );

                expect(res.status).toBe(400);
            },
        );

        describe("as a student", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginStudent(agent);
            });

            it("should return 200 and stream the file for a visible assignment attachment", async () => {
                const res = await agent.get(
                    `/assignments/${visibleAssignmentId.toString()}/attachments/${downloadAttachmentId.toString()}`,
                );

                expect(res.status).toBe(200);
                expect(res.headers["content-disposition"]).toBe(
                    `attachment; filename="Assignment Download Attachment"`,
                );
            });

            it("should return 404 for an attachment on a hidden assignment", async () => {
                const extraAttachment = await seeders.attachments.seedOne({
                    name: "Hidden Assignment Attachment",
                    path: "hidden_assignment_attachment.txt",
                });

                await seeders.assignmentAttachments.seedOne({
                    assignmentId: hiddenAssignmentId,
                    attachmentId: extraAttachment.id!,
                });

                const res = await agent.get(
                    `/assignments/${hiddenAssignmentId.toString()}/attachments/${extraAttachment.id!.toString()}`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 when the attachment does not belong to the assignment", async () => {
                const res = await agent.get(
                    `/assignments/${visibleAssignmentId.toString()}/attachments/99999`,
                );

                expect(res.status).toBe(404);
            });

            describe("download count tracking", () => {
                let countAttachment: { id: number; name: string };
                let countAssignmentId: number;
                let countAttachmentFileName: string;
                let testCounter = 0;

                beforeEach(async () => {
                    ++testCounter;
                    countAttachmentFileName = `assignment_count_attachment_${testCounter.toString()}.txt`;

                    const attachment = await seeders.attachments.seedOne({
                        name: "Count Attachment",
                        path: countAttachmentFileName,
                    });

                    countAttachment = {
                        id: attachment.id!,
                        name: attachment.name,
                    };

                    await writeFile(
                        join(storagePath, countAttachmentFileName),
                        "count test content",
                    );

                    const assignment = await seeders.assignments.seedOne({
                        classSubjectId,
                        title: "Download Count Assignment",
                        visible: true,
                    });

                    countAssignmentId = assignment.id!;

                    await seeders.assignmentAttachments.seedOne({
                        assignmentId: countAssignmentId,
                        attachmentId: countAttachment.id,
                    });
                });

                afterEach(async () => {
                    await rm(join(storagePath, countAttachmentFileName), {
                        force: true,
                    });
                });

                async function waitForDownloadCount(
                    expectedCount: number,
                ): Promise<number> {
                    const deadline = Date.now() + 2000;
                    let lastCount = -1;

                    while (Date.now() < deadline) {
                        const res = await agent.get(
                            `/assignments/${countAssignmentId.toString()}`,
                        );

                        const body = res.body as StudentSubjectAssignment;

                        lastCount =
                            body.attachments.find(
                                (a) => a.id === countAttachment.id,
                            )?.downloadCount ?? 0;

                        if (lastCount === expectedCount) {
                            return lastCount;
                        }

                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    return lastCount;
                }

                it("should increment the download count after a successful download", async () => {
                    const downloadRes = await agent.get(
                        `/assignments/${countAssignmentId.toString()}/attachments/${countAttachment.id.toString()}`,
                    );

                    expect(downloadRes.status).toBe(200);

                    const count = await waitForDownloadCount(1);

                    expect(count).toBe(1);
                });

                it("should increment the download count on every download, without deduplication", async () => {
                    await agent.get(
                        `/assignments/${countAssignmentId.toString()}/attachments/${countAttachment.id.toString()}`,
                    );

                    await agent.get(
                        `/assignments/${countAssignmentId.toString()}/attachments/${countAttachment.id.toString()}`,
                    );

                    const count = await waitForDownloadCount(2);

                    expect(count).toBe(2);
                });

                it("should not increment the download count when the download 404s", async () => {
                    const downloadRes = await agent.get(
                        `/assignments/${countAssignmentId.toString()}/attachments/99999`,
                    );

                    expect(downloadRes.status).toBe(404);

                    // Give any (incorrectly) fired async write a chance to land before asserting it didn't.
                    await new Promise((resolve) => setTimeout(resolve, 200));

                    const verify = await agent.get(
                        `/assignments/${countAssignmentId.toString()}`,
                    );

                    const body = verify.body as StudentSubjectAssignment;

                    const attachment = body.attachments.find(
                        (a) => a.id === countAttachment.id,
                    );

                    expect(attachment?.downloadCount ?? 0).toBe(0);
                });

                it("should reflect the download count in both student-facing and teacher-facing assignment responses", async () => {
                    const downloadRes = await agent.get(
                        `/assignments/${countAssignmentId.toString()}/attachments/${countAttachment.id.toString()}`,
                    );

                    expect(downloadRes.status).toBe(200);

                    const studentCount = await waitForDownloadCount(1);

                    expect(studentCount).toBe(1);

                    const teacherAgent = request.agent(app);
                    await loginTeacher(teacherAgent);

                    const teacherRes = await teacherAgent.get(
                        `/assignments/${countAssignmentId.toString()}`,
                    );

                    const teacherBody =
                        teacherRes.body as TeacherSubjectAssignment;

                    const teacherAttachment = teacherBody.attachments.find(
                        (a) => a.id === countAttachment.id,
                    );

                    expect(teacherAttachment?.downloadCount).toBe(1);
                });
            });
        });

        describe("as a teacher", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginTeacher(agent);
            });

            it("should return 200 and stream the file for an assigned teacher", async () => {
                const res = await agent.get(
                    `/assignments/${visibleAssignmentId.toString()}/attachments/${downloadAttachmentId.toString()}`,
                );

                expect(res.status).toBe(200);
                expect(res.headers["content-disposition"]).toBe(
                    `attachment; filename="Assignment Download Attachment"`,
                );
            });

            it("should return 404 when the attachment does not belong to the assignment", async () => {
                const res = await agent.get(
                    `/assignments/${visibleAssignmentId.toString()}/attachments/99999`,
                );

                expect(res.status).toBe(404);
            });
        });
    });

    describe("POST /assignments", () => {
        afterEach(async () => {
            await rm(join(storagePath, "attachments"), {
                recursive: true,
                force: true,
            });
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).post("/assignments");

            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .post("/assignments")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "New Assignment");

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .post("/assignments")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "New Assignment");

            expect(res.status).toBe(403);
        });

        it("should return 400 when classSubjectId is missing", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/assignments")
                .field("title", "New Assignment");

            expect(res.status).toBe(400);
        });

        it("should return 400 when title is empty", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/assignments")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher is not assigned to the class subject", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/assignments")
                .field("classSubjectId", "99999")
                .field("title", "New Assignment");

            expect(res.status).toBe(404);
        });

        it("should return 201 with a file attachment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/assignments")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "Integration Test Assignment")
                .field("visible", "false")
                .attach("files", Buffer.from("soal content"), {
                    filename: "soal.pdf",
                    contentType: "application/pdf",
                });

            expect(res.status).toBe(201);

            const body = res.body as TeacherSubjectAssignment;
            expect(body.title).toBe("Integration Test Assignment");
            expect(body.classSubjectId).toBe(classSubjectId);
            expect(body.visible).toBe(false);
            expect(body.attachments).toHaveLength(1);
            expect(body.attachments[0].name).toBe("soal.pdf");
        });

        it("should return 201 without any files", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/assignments")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "No Attachment Assignment");

            expect(res.status).toBe(201);

            const body = res.body as TeacherSubjectAssignment;
            expect(body.title).toBe("No Attachment Assignment");
            expect(body.attachments).toHaveLength(0);
        });
    });

    describe("PUT /assignments/:id", () => {
        let editAssignmentId: number;

        beforeEach(async () => {
            const a = await seeders.assignments.seedOne({
                classSubjectId,
                title: "Editable Assignment",
                description: null,
                visible: false,
            });

            editAssignmentId = a.id!;
        });

        afterEach(async () => {
            await rm(join(storagePath, "attachments"), {
                recursive: true,
                force: true,
            });
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).put(
                `/assignments/${editAssignmentId.toString()}`,
            );
            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .put(`/assignments/${editAssignmentId.toString()}`)
                .field("title", "Updated");

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .put(`/assignments/${editAssignmentId.toString()}`)
                .field("title", "Updated");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid ID", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put("/assignments/abc")
                .field("title", "Updated");

            expect(res.status).toBe(400);
        });

        it("should return 400 when title is missing", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put(`/assignments/${editAssignmentId.toString()}`)
                .field("visible", "true");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher does not own the assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put(`/assignments/${unassignedAssignmentId.toString()}`)
                .field("title", "Updated");

            expect(res.status).toBe(404);
        });

        it("should return 200 and update the assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put(`/assignments/${editAssignmentId.toString()}`)
                .field("title", "Updated Title")
                .field("description", "New desc")
                .field("visible", "true");

            expect(res.status).toBe(200);

            const verify = await agent.get(
                `/assignments/${editAssignmentId.toString()}`,
            );

            const body = verify.body as TeacherSubjectAssignment;
            expect(body.title).toBe("Updated Title");
            expect(body.visible).toBe(true);
        });
    });

    describe("DELETE /assignments/:id", () => {
        let deleteAssignmentId: number;

        beforeEach(async () => {
            const a = await seeders.assignments.seedOne({
                classSubjectId,
                title: "To Be Deleted",
                description: null,
                visible: false,
            });

            deleteAssignmentId = a.id!;
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).delete(
                `/assignments/${deleteAssignmentId.toString()}`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(
                `/assignments/${deleteAssignmentId.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(
                `/assignments/${deleteAssignmentId.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid ID", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete("/assignments/abc");
            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher does not own the assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(
                `/assignments/${unassignedAssignmentId.toString()}`,
            );

            expect(res.status).toBe(404);
        });

        it("should return 204 and remove the assignment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(
                `/assignments/${deleteAssignmentId.toString()}`,
            );

            expect(res.status).toBe(204);

            const verify = await agent.get(
                `/assignments/${deleteAssignmentId.toString()}`,
            );

            expect(verify.status).toBe(404);
        });
    });
});
