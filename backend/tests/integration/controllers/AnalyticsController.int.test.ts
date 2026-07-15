import { seededPrimaryData, testPasswordHash } from "@psb/shared/tests";
import { DownloadAnalytics, UserRole } from "@psb/shared/types";
import { app } from "@test/setup/app";
import {
    loginAdministrator,
    loginStudent,
    loginTeacher,
    loginWithCredentials,
    seeders,
    testDbManager,
} from "@test/utils";
import request from "supertest";

describe("AnalyticsController (integration)", () => {
    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const teacher = seededPrimaryData.teachers[0];

    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;

    const endpoint = `/analytics/downloads?session=${encodeURIComponent(session.session)}&semester=${session.semester.toString()}`;

    // A Monday, seeded at noon UTC, so ISO week bucketing is unambiguous regardless of local
    // timezone handling.
    const weekStart = new Date("2024-03-04T12:00:00.000Z");
    const weekStartStr = "2024-03-04";

    let classId: number;
    let classSubjectId: number;

    let materialId: number;
    let materialAttachmentId: number;

    let assignmentId: number;
    let assignmentAttachmentId: number;

    let otherTeacherUserId: number;
    let otherTeacherAttachmentId: number;

    beforeAll(async () => {
        const cls = await seeders.classes.seedOne({
            name: "XI-ANALYTICS-CTRL-1",
            session: session.session,
            semester: session.semester,
        });

        classId = cls.id!;

        const classSubject = await seeders.classSubjects.seedOne({
            classId,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        classSubjectId = classSubject.id!;

        const material = await seeders.materials.seedOne({
            classSubjectId,
            title: "Analytics Controller Material",
            description: null,
            visible: true,
        });

        materialId = material.id!;

        const materialAttachment = await seeders.attachments.seedOne({
            name: "Analytics Controller Material Attachment",
            path: "analytics_controller_material_attachment.txt",
        });

        materialAttachmentId = materialAttachment.id!;

        await seeders.materialAttachments.seedOne({
            materialId,
            attachmentId: materialAttachmentId,
        });

        const assignment = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Analytics Controller Assignment",
            description: null,
            visible: true,
        });

        assignmentId = assignment.id!;

        const assignmentAttachment = await seeders.attachments.seedOne({
            name: "Analytics Controller Assignment Attachment",
            path: "analytics_controller_assignment_attachment.txt",
        });

        assignmentAttachmentId = assignmentAttachment.id!;

        await seeders.assignmentAttachments.seedOne({
            assignmentId,
            attachmentId: assignmentAttachmentId,
        });

        // Two material downloads and one assignment download, all within the same week, by the
        // seeded student.
        await seeders.attachmentDownloads.seedOne({
            attachmentId: materialAttachmentId,
            userId: student.id,
            downloadedAt: weekStart,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: materialAttachmentId,
            userId: student.id,
            downloadedAt: weekStart,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: assignmentAttachmentId,
            userId: student.id,
            downloadedAt: weekStart,
        });

        // A class subject in the same session/semester but taught by a different teacher. Its
        // download must be excluded from the target teacher's response.
        const otherTeacherUser = await seeders.users.seedOne({
            active: true,
            name: "Other Analytics Controller Teacher",
            password: testPasswordHash,
            role: UserRole.Teacher,
            identifier: "analytics-controller-other-teacher",
        });

        otherTeacherUserId = otherTeacherUser.id!;

        await seeders.teachers.seedOne({ userId: otherTeacherUserId });

        const otherTeacherClass = await seeders.classes.seedOne({
            name: "XI-ANALYTICS-CTRL-2",
            session: session.session,
            semester: session.semester,
        });

        const otherTeacherClassSubject = await seeders.classSubjects.seedOne({
            classId: otherTeacherClass.id!,
            subjectId: subject.id,
            teacherId: otherTeacherUserId,
        });

        const otherTeacherMaterial = await seeders.materials.seedOne({
            classSubjectId: otherTeacherClassSubject.id!,
            title: "Other Teacher Material",
            description: null,
            visible: true,
        });

        const otherTeacherAttachment = await seeders.attachments.seedOne({
            name: "Other Teacher Attachment",
            path: "analytics_controller_other_teacher_attachment.txt",
        });

        otherTeacherAttachmentId = otherTeacherAttachment.id!;

        await seeders.materialAttachments.seedOne({
            materialId: otherTeacherMaterial.id!,
            attachmentId: otherTeacherAttachmentId,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: otherTeacherAttachmentId,
            userId: student.id,
            downloadedAt: weekStart,
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /analytics/downloads", () => {
        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);

            expect(res.status).toBe(401);
        });

        it("should return 403 if user is a student", async () => {
            const agent = request.agent(app);
            await loginStudent(agent);

            const res = await agent.get(endpoint);

            expect(res.status).toBe(403);
        });

        it("should return 403 if user is an administrator", async () => {
            const agent = request.agent(app);
            await loginAdministrator(agent);

            const res = await agent.get(endpoint);

            expect(res.status).toBe(403);
        });

        it("should return 400 for an invalid session/semester query", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(
                "/analytics/downloads?session=invalid&semester=1",
            );

            expect(res.status).toBe(400);
        });

        it("should return the teacher's download analytics, excluding other teachers' downloads", async () => {
            const agent = request.agent(app);
            await loginTeacher(agent);

            const res = await agent.get(endpoint);

            expect(res.status).toBe(200);

            const body = res.body as DownloadAnalytics;

            // Time series: material (2) + assignment (1) downloads merge into a single week's
            // count of 3. The other teacher's download must not be included.
            expect(body.timeSeries).toEqual([
                { weekStart: weekStartStr, count: 3 },
            ]);

            // Top attachments: both the material and assignment attachments should be present,
            // ranked by download count, with the other teacher's attachment excluded.
            expect(body.topAttachments).toHaveLength(2);

            const attachmentIds = body.topAttachments.map(
                (a) => a.attachmentId,
            );

            expect(attachmentIds).not.toContain(otherTeacherAttachmentId);

            expect(body.topAttachments[0]).toMatchObject({
                attachmentId: materialAttachmentId,
                name: "Analytics Controller Material Attachment",
                downloadCount: 2,
                type: "material",
                contentId: materialId,
                contentTitle: "Analytics Controller Material",
                classSubjectId,
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name,
                },
                class: { id: classId, name: "XI-ANALYTICS-CTRL-1" },
            });

            expect(body.topAttachments[1]).toMatchObject({
                attachmentId: assignmentAttachmentId,
                name: "Analytics Controller Assignment Attachment",
                downloadCount: 1,
                type: "assignment",
                contentId: assignmentId,
                contentTitle: "Analytics Controller Assignment",
                classSubjectId,
            });
        });

        it("should not include another teacher's downloads when queried by that teacher", async () => {
            const agent = request.agent(app);
            await loginWithCredentials(
                agent,
                "analytics-controller-other-teacher",
            );

            const analyticsRes = await agent.get(endpoint);

            expect(analyticsRes.status).toBe(200);

            const body = analyticsRes.body as DownloadAnalytics;

            const attachmentIds = body.topAttachments.map(
                (a) => a.attachmentId,
            );

            expect(attachmentIds).toContain(otherTeacherAttachmentId);
            expect(attachmentIds).not.toContain(materialAttachmentId);
            expect(attachmentIds).not.toContain(assignmentAttachmentId);
        });
    });
});
