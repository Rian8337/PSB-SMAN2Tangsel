import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import { seededPrimaryData } from "@psb/shared/tests";
import request from "supertest";

const session = seededPrimaryData.sessions[0];
const subject = seededPrimaryData.subjects[0];

let studentClassSubjectId: number;
let visibleMaterialId: number;
let hiddenMaterialId: number;
let inaccessibleMaterialId: number;

beforeAll(async () => {
    const cls = await seeders.classes.seedOne({
        name: "X-BOOKMARK-CTRL-1",
        session: session.session,
        semester: session.semester,
    });

    const otherCls = await seeders.classes.seedOne({
        name: "X-BOOKMARK-CTRL-2",
        session: session.session,
        semester: session.semester,
    });

    const student = seededPrimaryData.users.find(
        (u) => u.identifier === "0012345678",
    )!;
    const teacher = seededPrimaryData.users.find((u) => u.identifier === "2")!;

    await seeders.studentClasses.seedOne({
        classId: cls.id!,
        studentId: student.id,
    });

    const classSubject = await seeders.classSubjects.seedOne({
        classId: cls.id!,
        subjectId: subject.id,
        teacherId: teacher.id,
    });

    const otherClassSubject = await seeders.classSubjects.seedOne({
        classId: otherCls.id!,
        subjectId: subject.id,
        teacherId: teacher.id,
    });

    studentClassSubjectId = classSubject.id!;

    const visibleMaterial = await seeders.materials.seedOne({
        classSubjectId: classSubject.id!,
        title: "Visible Material",
        visible: true,
    });

    const hiddenMaterial = await seeders.materials.seedOne({
        classSubjectId: classSubject.id!,
        title: "Hidden Material",
        visible: false,
    });

    const inaccessibleMaterial = await seeders.materials.seedOne({
        classSubjectId: otherClassSubject.id!,
        title: "Inaccessible Material",
        visible: true,
    });

    visibleMaterialId = visibleMaterial.id!;
    hiddenMaterialId = hiddenMaterial.id!;
    inaccessibleMaterialId = inaccessibleMaterial.id!;
});

afterAll(async () => {
    await testDbManager.cleanupSecondaryTables();
});

describe("RBAC", () => {
    it("should return 401 for an unauthenticated request", async () => {
        const res = await request(app).get(
            "/bookmarks/materials/ids?classSubjectId=1",
        );

        expect(res.status).toBe(401);
    });

    it("should return 403 for an administrator", async () => {
        const agent = request.agent(app);
        await loginAdministrator(agent);

        const res = await agent.put(
            `/bookmarks/materials/${visibleMaterialId.toString()}`,
        );

        expect(res.status).toBe(403);
    });
});

describe("PUT /bookmarks/materials/:materialId", () => {
    it("should let a student bookmark a visible material they are enrolled in", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        const res = await agent.put(
            `/bookmarks/materials/${visibleMaterialId.toString()}`,
        );

        expect(res.status).toBe(204);

        const idsRes = await agent.get(
            `/bookmarks/materials/ids?classSubjectId=${studentClassSubjectId.toString()}`,
        );

        expect(idsRes.body).toContain(visibleMaterialId);
    });

    it("should return 404 when a student bookmarks a hidden material", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        const res = await agent.put(
            `/bookmarks/materials/${hiddenMaterialId.toString()}`,
        );

        expect(res.status).toBe(404);
    });

    it("should return 404 when a student bookmarks a material outside their class", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        const res = await agent.put(
            `/bookmarks/materials/${inaccessibleMaterialId.toString()}`,
        );

        expect(res.status).toBe(404);
    });

    it("should let a teacher bookmark a hidden material they teach", async () => {
        const agent = request.agent(app);
        await loginTeacher(agent);

        const res = await agent.put(
            `/bookmarks/materials/${hiddenMaterialId.toString()}`,
        );

        expect(res.status).toBe(204);
    });

    it("should be idempotent when bookmarking the same material twice", async () => {
        const agent = request.agent(app);
        await loginTeacher(agent);

        await agent.put(`/bookmarks/materials/${visibleMaterialId.toString()}`);
        const res = await agent.put(
            `/bookmarks/materials/${visibleMaterialId.toString()}`,
        );

        expect(res.status).toBe(204);
    });
});

describe("DELETE /bookmarks/materials/:materialId", () => {
    it("should remove a bookmark", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        await agent.put(`/bookmarks/materials/${visibleMaterialId.toString()}`);
        const deleteRes = await agent.delete(
            `/bookmarks/materials/${visibleMaterialId.toString()}`,
        );

        expect(deleteRes.status).toBe(204);

        const idsRes = await agent.get(
            `/bookmarks/materials/ids?classSubjectId=${studentClassSubjectId.toString()}`,
        );

        expect(idsRes.body).not.toContain(visibleMaterialId);
    });

    it("should return 204 when removing a bookmark that does not exist", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        const res = await agent.delete(
            `/bookmarks/materials/${visibleMaterialId.toString()}`,
        );

        expect(res.status).toBe(204);
    });
});

describe("GET /bookmarks", () => {
    it("should return the current user's bookmarks scoped to the given session and semester", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        await agent.put(`/bookmarks/materials/${visibleMaterialId.toString()}`);

        const res = await agent.get(
            `/bookmarks?session=${encodeURIComponent(session.session)}&semester=${session.semester.toString()}`,
        );

        expect(res.status).toBe(200);

        expect(
            (res.body as { materialId: number }[]).some(
                (b) => b.materialId === visibleMaterialId,
            ),
        ).toBe(true);
    });

    it("should return 400 for an invalid session format", async () => {
        const agent = request.agent(app);
        await loginStudent(agent);

        const res = await agent.get("/bookmarks?session=bad&semester=1");

        expect(res.status).toBe(400);
    });
});
