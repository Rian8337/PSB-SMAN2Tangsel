import { students, users } from "@psb/shared/schema";
import { seededPrimaryData, testPassword } from "@psb/shared/tests";
import { UserListItem, UserRole } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDb,
    testDbManager,
} from "@test/utils";
import { eq } from "drizzle-orm";
import request from "supertest";

describe("ClassStudentController (integration)", () => {
    const studentEnrolled = seededPrimaryData.students[0];
    const studentUnenrolled = seededPrimaryData.students[1];

    let classId: number;
    let unenrolledStudent: typeof students.$inferInsert;

    beforeAll(async () => {
        const freshUser = await seeders.users.seedOne({
            identifier: "0012345680",
            name: "Fresh Student",
            password: testPassword,
            role: UserRole.Student,
        });

        unenrolledStudent = await seeders.students.seedOne({
            userId: freshUser.id!,
        });

        const session = seededPrimaryData.sessions[0];

        const clazz = await seeders.classes.seedOne({
            name: "Test Class Student Enrollments",
            session: session.session,
            semester: session.semester,
        });

        classId = clazz.id!;

        await seeders.studentClasses.seedOne({
            classId,
            studentId: studentEnrolled.userId,
        });
    });

    afterAll(async () => {
        await testDbManager.cleanupSecondaryTables();

        await testDb
            .delete(users)
            .where(eq(users.id, unenrolledStudent.userId));
    });

    describe("GET /classes/:id/students", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${classId.toString()}/students`;
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

        it("should return 200 and the enrolled students if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            const body = res.body as UserListItem[];

            expect(res.status).toBe(200);

            expect(body).toBeInstanceOf(Array);
            expect(body.length).toBeGreaterThanOrEqual(1);
            expect(body.some((s) => s.id === studentEnrolled.userId)).toBe(
                true,
            );
        });
    });

    describe("GET /classes/:id/students/unenrolled", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${classId.toString()}/students/unenrolled`;
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

        it("should return 200 and the unenrolled students if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);
            const body = res.body as UserListItem[];

            expect(res.status).toBe(200);

            expect(body).toBeInstanceOf(Array);
            expect(body.some((s) => s.id === unenrolledStudent.userId)).toBe(
                true,
            );
        });
    });

    describe("POST /classes/:id/students", () => {
        let payload: { studentId: number };
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${classId.toString()}/students`;
            payload = { studentId: studentUnenrolled.userId };
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

        it("should enroll the student and return 201 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.post(endpoint).send(payload);

            expect(res.status).toBe(201);
        });
    });

    describe("DELETE /classes/:id/students/:studentId", () => {
        let endpoint: string;

        beforeAll(() => {
            endpoint = `/classes/${classId.toString()}/students/${studentEnrolled.userId.toString()}`;
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

        it("should unenroll the student and return 204 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.delete(endpoint);
            expect(res.status).toBe(204);
        });
    });
});
