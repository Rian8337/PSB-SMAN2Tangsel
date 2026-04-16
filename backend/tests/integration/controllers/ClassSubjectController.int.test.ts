import { seededPrimaryData } from "@psb/shared/tests";
import { ClassSubjectAssignment, Subject } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("ClassSubjectController (integration)", () => {
    const teacher = seededPrimaryData.teachers[0];
    const subjectAssigned = seededPrimaryData.subjects[0];
    const subjectUnassigned = seededPrimaryData.subjects[1];

    let classId: number;
    let classSubjectId: number;

    beforeAll(async () => {
        const session = seededPrimaryData.sessions[0];

        const clazz = await seeders.classes.seedOne({
            name: "Test Class",
            session: session.session,
            semester: session.semester,
        });

        classId = clazz.id!;

        const classSubject = await seeders.classSubjects.seedOne({
            classId,
            subjectId: subjectAssigned.id,
            teacherId: teacher.userId,
        });

        classSubjectId = classSubject.id!;
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /class-subjects/:id/assigned", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/class-subjects/${classId.toString()}/assigned`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 200 and the assigned subjects if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            const body = res.body as ClassSubjectAssignment[];

            expect(res.status).toBe(200);

            expect(body).toBeInstanceOf(Array);
            expect(body).toHaveLength(1);
            expect(body[0].subject.id).toBe(subjectAssigned.id);
        });
    });

    describe("GET /class-subjects/:id/unassigned", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/class-subjects/${classId.toString()}/unassigned`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 200 and the unassigned subjects if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            const body = res.body as Subject[];

            expect(res.status).toBe(200);

            expect(body).toBeInstanceOf(Array);
            expect(body.some((s) => s.id === subjectUnassigned.id)).toBe(true);
        });
    });

    describe("POST /class-subjects/:id", () => {
        const payload = { subjectId: 2, teacherId: null };
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/class-subjects/${classId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).post(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.post(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should assign the subject and return 201 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            // Dynamically use the real unassigned subject ID.
            const res = await agent.post(endpoint).send({
                subjectId: subjectUnassigned.id,
                teacherId: null,
            });

            expect(res.status).toBe(201);
        });
    });

    describe("PATCH /class-subjects/:id", () => {
        const payload = { teacherId: null };
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/class-subjects/${classSubjectId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).patch(endpoint).send(payload);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.patch(endpoint).send(payload);
            expect(res.status).toBe(403);
        });

        it("should update the assigned teacher and return 204 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent
                .patch(endpoint)
                .send({ teacherId: teacher.userId });

            expect(res.status).toBe(204);
        });
    });

    describe("DELETE /class-subjects/:id", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/class-subjects/${classSubjectId.toString()}`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).delete(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(403);
        });

        it("should return 403 if user is teacher", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(403);
        });

        it("should unassign the subject and return 204 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(204);
        });
    });
});
