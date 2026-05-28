import { seededPrimaryData } from "@psb/shared/tests";
import { AssignmentSubmissionRow } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("SubmissionController (integration)", () => {
    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];

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

        await seeders.assignmentSubmissions.seedOne({
            assignmentId,
            studentId: student.id,
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
    });

    afterAll(async () => {
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
});
