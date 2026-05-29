import { seededPrimaryData } from "@psb/shared/tests";
import { SubjectMaterial } from "@psb/shared/types";
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

describe("MaterialController (integration)", () => {
    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];
    const seededAttachment = seededPrimaryData.attachments[0];

    let classSubjectId: number;
    let visibleMaterialId: number;
    let hiddenMaterialId: number;
    let unassignedMaterialId: number;

    const storagePath = process.env.STORAGE_PATH ?? "./tests/storage";
    const testFilePath = join(storagePath, seededAttachment.path);

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

        const visibleMaterial = await seeders.materials.seedOne({
            classSubjectId,
            title: "Visible Material",
            description: "A visible material",
            visible: true,
        });

        visibleMaterialId = visibleMaterial.id!;

        const hiddenMaterial = await seeders.materials.seedOne({
            classSubjectId,
            title: "Hidden Material",
            description: null,
            visible: false,
        });

        hiddenMaterialId = hiddenMaterial.id!;

        await seeders.materialAttachments.seedOne({
            materialId: visibleMaterialId,
            attachmentId: seededAttachment.id,
        });

        // Class subject with no teacher assigned — used to test 404 for unassigned teacher.
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

        const unassignedMaterial = await seeders.materials.seedOne({
            classSubjectId: unassignedClassSubject.id!,
            title: "Unassigned Material",
            visible: true,
        });

        unassignedMaterialId = unassignedMaterial.id!;

        await mkdir(storagePath, { recursive: true });
        await writeFile(testFilePath, "test attachment content");
    });

    afterAll(async () => {
        await rm(testFilePath, { force: true });
        await testDbManager.cleanupSecondaryTables();
    });

    describe("GET /materials/:id", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/materials/${visibleMaterialId.toString()}`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/materials/${visibleMaterialId.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid ID format", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get("/materials/abc");

            expect(res.status).toBe(400);
        });

        describe("as a student", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginStudent(agent);
            });

            it("should return 200 with the material for an enrolled student viewing a visible material", async () => {
                const res = await agent.get(
                    `/materials/${visibleMaterialId.toString()}`,
                );

                expect(res.status).toBe(200);

                const body = res.body as SubjectMaterial;
                expect(body.id).toBe(visibleMaterialId);
                expect(body.classSubjectId).toBe(classSubjectId);
                expect(body.title).toBe("Visible Material");
                expect(body.visible).toBe(true);
                expect(body.subject.id).toBe(subject.id);
                expect(body.attachments).toHaveLength(1);
                expect(body.attachments[0].id).toBe(seededAttachment.id);
            });

            it("should return 404 for a hidden material", async () => {
                const res = await agent.get(
                    `/materials/${hiddenMaterialId.toString()}`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 when the student is not enrolled in the class", async () => {
                const res = await agent.get(
                    `/materials/${unassignedMaterialId.toString()}`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 for a non-existent material ID", async () => {
                const res = await agent.get("/materials/99999");

                expect(res.status).toBe(404);
            });
        });

        describe("as a teacher", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginTeacher(agent);
            });

            it("should return 200 for a visible material in an assigned class subject", async () => {
                const res = await agent.get(
                    `/materials/${visibleMaterialId.toString()}`,
                );

                expect(res.status).toBe(200);

                const body = res.body as SubjectMaterial;
                expect(body.id).toBe(visibleMaterialId);
                expect(body.visible).toBe(true);
                expect(body.attachments).toHaveLength(1);
            });

            it("should return 200 for a hidden material in an assigned class subject", async () => {
                const res = await agent.get(
                    `/materials/${hiddenMaterialId.toString()}`,
                );

                expect(res.status).toBe(200);

                const body = res.body as SubjectMaterial;
                expect(body.id).toBe(hiddenMaterialId);
                expect(body.visible).toBe(false);
            });

            it("should return 404 when the teacher is not assigned to the class subject", async () => {
                const res = await agent.get(
                    `/materials/${unassignedMaterialId.toString()}`,
                );

                expect(res.status).toBe(404);
            });
        });
    });

    describe("GET /materials/:materialId/attachments/:attachmentId", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/materials/${visibleMaterialId.toString()}/attachments/${seededAttachment.id.toString()}`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/materials/${visibleMaterialId.toString()}/attachments/${seededAttachment.id.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it.each([
            { materialId: "abc", attachmentId: "1" },
            { materialId: "0", attachmentId: "1" },
            { materialId: "1", attachmentId: "abc" },
            { materialId: "1", attachmentId: "-1" },
        ])(
            "should return 400 for invalid IDs: materialId=$materialId, attachmentId=$attachmentId",
            async ({ materialId, attachmentId }) => {
                const agent = request.agent(app);
                await loginStudent(agent);

                const res = await agent.get(
                    `/materials/${materialId}/attachments/${attachmentId}`,
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

            it("should return 200 and stream the file for a visible material attachment", async () => {
                const res = await agent.get(
                    `/materials/${visibleMaterialId.toString()}/attachments/${seededAttachment.id.toString()}`,
                );

                expect(res.status).toBe(200);
                expect(res.headers["content-disposition"]).toBe(
                    `attachment; filename="${seededAttachment.name}"`,
                );
            });

            it("should return 404 for an attachment on a hidden material", async () => {
                const extraAttachment = await seeders.attachments.seedOne({
                    name: "Hidden Attachment",
                    path: "hidden_attachment.txt",
                });

                await seeders.materialAttachments.seedOne({
                    materialId: hiddenMaterialId,
                    attachmentId: extraAttachment.id!,
                });

                const res = await agent.get(
                    `/materials/${hiddenMaterialId.toString()}/attachments/${extraAttachment.id!.toString()}`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 when the attachment does not belong to the material", async () => {
                const res = await agent.get(
                    `/materials/${visibleMaterialId.toString()}/attachments/99999`,
                );

                expect(res.status).toBe(404);
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
                    `/materials/${visibleMaterialId.toString()}/attachments/${seededAttachment.id.toString()}`,
                );

                expect(res.status).toBe(200);
                expect(res.headers["content-disposition"]).toBe(
                    `attachment; filename="${seededAttachment.name}"`,
                );
            });

            it("should return 404 when the attachment does not belong to the material", async () => {
                const res = await agent.get(
                    `/materials/${visibleMaterialId.toString()}/attachments/99999`,
                );

                expect(res.status).toBe(404);
            });
        });
    });

    describe("POST /materials", () => {
        afterEach(async () => {
            // Remove any attachment files created by the tests.
            await rm(join(storagePath, "attachments"), {
                recursive: true,
                force: true,
            });
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).post("/materials");

            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .post("/materials")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "New Material");

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .post("/materials")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "New Material");

            expect(res.status).toBe(403);
        });

        it("should return 400 when classSubjectId is missing", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/materials")
                .field("title", "New Material");

            expect(res.status).toBe(400);
        });

        it("should return 400 when title is empty", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/materials")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher is not assigned to the class subject", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/materials")
                .field("classSubjectId", unassignedMaterialId.toString())
                .field("title", "New Material");

            expect(res.status).toBe(404);
        });

        it("should return 201 with a file attachment", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/materials")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "Integration Test Material")
                .field("visible", "false")
                .attach("files", Buffer.from("test file content"), {
                    filename: "test.pdf",
                    contentType: "application/pdf",
                });

            expect(res.status).toBe(201);

            const body = res.body as SubjectMaterial;
            expect(body.title).toBe("Integration Test Material");
            expect(body.classSubjectId).toBe(classSubjectId);
            expect(body.visible).toBe(false);
            expect(body.attachments).toHaveLength(1);
            expect(body.attachments[0].name).toBe("test.pdf");
        });

        it("should return 201 without any files", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .post("/materials")
                .field("classSubjectId", classSubjectId.toString())
                .field("title", "No Attachment Material");

            expect(res.status).toBe(201);

            const body = res.body as SubjectMaterial;
            expect(body.title).toBe("No Attachment Material");
            expect(body.attachments).toHaveLength(0);
        });
    });

    describe("PUT /materials/:id", () => {
        let editMaterialId: number;

        beforeEach(async () => {
            const m = await seeders.materials.seedOne({
                classSubjectId,
                title: "Editable Material",
                description: null,
                visible: false,
            });
            editMaterialId = m.id!;
        });

        afterEach(async () => {
            // Remove any attachment files created by the tests.
            await rm(join(storagePath, "attachments"), {
                recursive: true,
                force: true,
            });
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).put(
                `/materials/${editMaterialId.toString()}`,
            );
            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent
                .put(`/materials/${editMaterialId.toString()}`)
                .field("title", "Updated");

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .put(`/materials/${editMaterialId.toString()}`)
                .field("title", "Updated");

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid ID", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put("/materials/abc")
                .field("title", "Updated");

            expect(res.status).toBe(400);
        });

        it("should return 400 when title is missing", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put(`/materials/${editMaterialId.toString()}`)
                .field("visible", "true");

            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher does not own the material", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put(`/materials/${unassignedMaterialId.toString()}`)
                .field("title", "Updated");

            expect(res.status).toBe(404);
        });

        it("should return 200 and update the material", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent
                .put(`/materials/${editMaterialId.toString()}`)
                .field("title", "Updated Title")
                .field("description", "New desc")
                .field("visible", "true");

            expect(res.status).toBe(200);

            const verify = await agent.get(
                `/materials/${editMaterialId.toString()}`,
            );
            const body = verify.body as SubjectMaterial;
            expect(body.title).toBe("Updated Title");
            expect(body.visible).toBe(true);
        });
    });

    describe("DELETE /materials/:id", () => {
        let deleteMaterialId: number;

        beforeEach(async () => {
            const m = await seeders.materials.seedOne({
                classSubjectId,
                title: "To Be Deleted",
                description: null,
                visible: false,
            });
            deleteMaterialId = m.id!;
        });

        it("should return 401 without authentication", async () => {
            const res = await request(app).delete(
                `/materials/${deleteMaterialId.toString()}`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 for a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(
                `/materials/${deleteMaterialId.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 403 for an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(
                `/materials/${deleteMaterialId.toString()}`,
            );

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid ID", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete("/materials/abc");
            expect(res.status).toBe(400);
        });

        it("should return 404 when the teacher does not own the material", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(
                `/materials/${unassignedMaterialId.toString()}`,
            );

            expect(res.status).toBe(404);
        });

        it("should return 204 and remove the material", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(
                `/materials/${deleteMaterialId.toString()}`,
            );

            expect(res.status).toBe(204);

            const verify = await agent.get(
                `/materials/${deleteMaterialId.toString()}`,
            );

            expect(verify.status).toBe(404);
        });
    });
});
