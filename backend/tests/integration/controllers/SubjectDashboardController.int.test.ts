import { seededPrimaryData } from "@psb/shared/tests";
import { SubjectDashboard } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("SubjectDashboardController (integration)", () => {
    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];

    let authorizedClassSubjectId: number;
    let unauthorizedClassSubjectId: number;

    beforeAll(async () => {
        // Class where student is enrolled and teacher is assigned.
        const authorizedClass = await seeders.classes.seedOne({
            name: "Auth Class",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: authorizedClass.id!,
            studentId: student.id,
        });

        const authorizedClassSubject = await seeders.classSubjects.seedOne({
            classId: authorizedClass.id!,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        authorizedClassSubjectId = authorizedClassSubject.id!;

        await seeders.materials.seedMany(
            {
                classSubjectId: authorizedClassSubjectId,
                title: "Visible Material",
                visible: true,
            },
            {
                classSubjectId: authorizedClassSubjectId,
                title: "Hidden Material",
                visible: false,
            },
        );

        await seeders.assignments.seedOne({
            classSubjectId: authorizedClassSubjectId,
            title: "Visible Assignment",
            visible: true,
        });

        // Class where student is NOT enrolled (to test 404 for student).
        const unauthorizedClass = await seeders.classes.seedOne({
            name: "Unauth Class",
            session: session.session,
            semester: session.semester,
        });

        const unauthorizedClassSubject = await seeders.classSubjects.seedOne({
            classId: unauthorizedClass.id!,
            subjectId: subject.id,
            teacherId: null,
        });

        unauthorizedClassSubjectId = unauthorizedClassSubject.id!;
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /class-subjects/:id/dashboard", () => {
        it("should return 401 without authentication", async () => {
            const res = await request(app).get(
                `/class-subjects/${authorizedClassSubjectId.toString()}/dashboard`,
            );

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(
                `/class-subjects/${authorizedClassSubjectId.toString()}/dashboard`,
            );

            expect(res.status).toBe(403);
        });

        describe("as a student", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginStudent(agent);
            });

            it("should return 200 with only visible items for an enrolled student", async () => {
                const res = await agent.get(
                    `/class-subjects/${authorizedClassSubjectId.toString()}/dashboard`,
                );

                expect(res.status).toBe(200);

                const body = res.body as SubjectDashboard;
                expect(body.subject.id).toBe(subject.id);

                // Only visible material should appear.
                expect(body.materials).toHaveLength(1);
                expect(body.materials[0].title).toBe("Visible Material");

                // Only visible assignment should appear.
                expect(body.assignments).toHaveLength(1);
                expect(body.assignments[0].title).toBe("Visible Assignment");
            });

            it("should return 404 if the student is not enrolled in the class", async () => {
                const res = await agent.get(
                    `/class-subjects/${unauthorizedClassSubjectId.toString()}/dashboard`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 for a non-existent class subject ID", async () => {
                const res = await agent.get("/class-subjects/99999/dashboard");
                expect(res.status).toBe(404);
            });
        });

        describe("as a teacher", () => {
            let agent: ReturnType<typeof request.agent>;

            beforeEach(async () => {
                agent = request.agent(app);
                await loginTeacher(agent);
            });

            it("should return 200 with all items (including hidden) for an assigned teacher", async () => {
                const res = await agent.get(
                    `/class-subjects/${authorizedClassSubjectId.toString()}/dashboard`,
                );

                expect(res.status).toBe(200);

                const body = res.body as SubjectDashboard;
                expect(body.subject.id).toBe(subject.id);

                // Both visible and hidden materials should appear.
                expect(body.materials).toHaveLength(2);

                // Visible assignment should appear.
                expect(body.assignments).toHaveLength(1);
            });

            it("should return 404 if the teacher is not assigned to the class subject", async () => {
                const res = await agent.get(
                    `/class-subjects/${unauthorizedClassSubjectId.toString()}/dashboard`,
                );

                expect(res.status).toBe(404);
            });

            it("should return 404 for a non-existent class subject ID", async () => {
                const res = await agent.get("/class-subjects/99999/dashboard");
                expect(res.status).toBe(404);
            });
        });

        it("should return 400 for an invalid ID format", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get("/class-subjects/abc/dashboard");
            expect(res.status).toBe(400);
        });
    });
});
