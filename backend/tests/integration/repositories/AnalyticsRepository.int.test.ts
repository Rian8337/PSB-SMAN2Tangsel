import { AnalyticsRepository } from "@/repositories/AnalyticsRepository";
import { seededPrimaryData, testPasswordHash } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { seeders, testDb, testDbManager } from "@test/utils";

describe("AnalyticsRepository (integration)", () => {
    const repository = new AnalyticsRepository(testDb);

    // The active session/semester that most of the seeded data (and assertions) target.
    const session = seededPrimaryData.sessions[0];

    // A different session/semester (same session string, different semester) used to verify that
    // downloads outside the queried session/semester are excluded.
    const otherSessionData = seededPrimaryData.sessions[1];

    const subject = seededPrimaryData.subjects[0];
    const teacher = seededPrimaryData.teachers[0];

    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;

    const otherStudent = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[1].userId,
    )!;

    // Two Mondays, comfortably two weeks apart (and seeded at noon UTC) so that ISO week bucketing
    // is unambiguous regardless of local timezone handling.
    const week1 = new Date("2024-03-04T12:00:00.000Z");
    const week1Str = "2024-03-04";
    const week2 = new Date("2024-03-18T12:00:00.000Z");
    const week2Str = "2024-03-18";

    let classSubjectId: number;
    let classId: number;

    let materialId: number;
    let materialAttachmentId: number;

    let assignmentId: number;
    let assignmentAttachmentId: number;

    let otherTeacherUserId: number;
    let otherSessionAttachmentId: number;
    let otherTeacherAttachmentId: number;

    beforeAll(async () => {
        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-1",
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

        // A material with an attachment, downloaded once in week 1 and three times in week 2.
        const material = await seeders.materials.seedOne({
            classSubjectId,
            title: "Material One",
            description: null,
            visible: true,
        });

        materialId = material.id!;

        const materialAttachment = await seeders.attachments.seedOne({
            name: "Material Attachment",
            path: "analytics_material_attachment.txt",
        });

        materialAttachmentId = materialAttachment.id!;

        await seeders.materialAttachments.seedOne({
            materialId,
            attachmentId: materialAttachmentId,
        });

        // An assignment with an attachment, downloaded once in week 1 (same week as a material
        // download above), so the two sources must merge into a single combined-count week.
        const assignment = await seeders.assignments.seedOne({
            classSubjectId,
            title: "Assignment One",
            description: null,
            visible: true,
        });

        assignmentId = assignment.id!;

        const assignmentAttachment = await seeders.attachments.seedOne({
            name: "Assignment Attachment",
            path: "analytics_assignment_attachment.txt",
        });

        assignmentAttachmentId = assignmentAttachment.id!;

        await seeders.assignmentAttachments.seedOne({
            assignmentId,
            attachmentId: assignmentAttachmentId,
        });

        // Week 1: one material download + one assignment download -> should merge into one point.
        await seeders.attachmentDownloads.seedOne({
            attachmentId: materialAttachmentId,
            userId: student.id,
            downloadedAt: week1,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: assignmentAttachmentId,
            userId: student.id,
            downloadedAt: week1,
        });

        // Week 2: three material downloads, no assignment downloads.
        await seeders.attachmentDownloads.seedOne({
            attachmentId: materialAttachmentId,
            userId: student.id,
            downloadedAt: week2,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: materialAttachmentId,
            userId: otherStudent.id,
            downloadedAt: week2,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: materialAttachmentId,
            userId: student.id,
            downloadedAt: week2,
        });

        // A class subject taught by the SAME teacher, but in a different session/semester. Its
        // download must be excluded when querying the target session/semester.
        const otherSessionClass = await seeders.classes.seedOne({
            name: "XI-IPA-2",
            session: otherSessionData.session,
            semester: otherSessionData.semester,
        });

        const otherSessionClassSubject = await seeders.classSubjects.seedOne({
            classId: otherSessionClass.id!,
            subjectId: subject.id,
            teacherId: teacher.userId,
        });

        const otherSessionMaterial = await seeders.materials.seedOne({
            classSubjectId: otherSessionClassSubject.id!,
            title: "Other Session Material",
            description: null,
            visible: true,
        });

        const otherSessionAttachment = await seeders.attachments.seedOne({
            name: "Other Session Attachment",
            path: "analytics_other_session_attachment.txt",
        });

        otherSessionAttachmentId = otherSessionAttachment.id!;

        await seeders.materialAttachments.seedOne({
            materialId: otherSessionMaterial.id!,
            attachmentId: otherSessionAttachmentId,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: otherSessionAttachmentId,
            userId: student.id,
            downloadedAt: week1,
        });

        // A class subject in the SAME session/semester, but taught by a DIFFERENT teacher. Its
        // download must be excluded when querying the target teacher.
        const otherTeacherUser = await seeders.users.seedOne({
            active: true,
            name: "Other Teacher",
            password: testPasswordHash,
            role: UserRole.Teacher,
            identifier: "analytics-other-teacher",
        });

        otherTeacherUserId = otherTeacherUser.id!;

        await seeders.teachers.seedOne({ userId: otherTeacherUserId });

        const otherTeacherClass = await seeders.classes.seedOne({
            name: "XI-IPA-3",
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
            path: "analytics_other_teacher_attachment.txt",
        });

        otherTeacherAttachmentId = otherTeacherAttachment.id!;

        await seeders.materialAttachments.seedOne({
            materialId: otherTeacherMaterial.id!,
            attachmentId: otherTeacherAttachmentId,
        });

        await seeders.attachmentDownloads.seedOne({
            attachmentId: otherTeacherAttachmentId,
            userId: student.id,
            downloadedAt: week1,
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("getDownloadTimeSeries", () => {
        it("returns one point per week with correct summed counts, merging material and assignment downloads within the same week", async () => {
            const result = await repository.getDownloadTimeSeries(
                teacher.userId,
                session.session,
                session.semester,
            );

            expect(result).toEqual([
                { weekStart: week1Str, count: 2 },
                { weekStart: week2Str, count: 3 },
            ]);
        });

        it("only counts downloads within the given session/semester", async () => {
            // Querying the OTHER session/semester should only see the download seeded there, not
            // the target session/semester's downloads.
            const otherSessionResult = await repository.getDownloadTimeSeries(
                teacher.userId,
                otherSessionData.session,
                otherSessionData.semester,
            );

            expect(otherSessionResult).toEqual([
                { weekStart: week1Str, count: 1 },
            ]);

            // Querying the target session/semester should not include the other session's download
            // (week 1's count would be 3, not 2, if it had leaked in).
            const targetSessionResult = await repository.getDownloadTimeSeries(
                teacher.userId,
                session.session,
                session.semester,
            );

            expect(
                targetSessionResult.find((p) => p.weekStart === week1Str)
                    ?.count,
            ).toBe(2);
        });

        it("only counts downloads for classes the given teacher teaches", async () => {
            // Querying as the OTHER teacher should only see the download seeded for their class.
            const otherTeacherResult = await repository.getDownloadTimeSeries(
                otherTeacherUserId,
                session.session,
                session.semester,
            );

            expect(otherTeacherResult).toEqual([
                { weekStart: week1Str, count: 1 },
            ]);

            // Querying as the target teacher should not include the other teacher's download (week
            // 1's count would be 3, not 2, if it had leaked in).
            const targetTeacherResult = await repository.getDownloadTimeSeries(
                teacher.userId,
                session.session,
                session.semester,
            );

            expect(
                targetTeacherResult.find((p) => p.weekStart === week1Str)
                    ?.count,
            ).toBe(2);
        });
    });

    describe("getTopDownloadedAttachments", () => {
        it("ranks material and assignment attachments together by download count, descending, with correct type/content fields", async () => {
            const result = await repository.getTopDownloadedAttachments(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            expect(result).toHaveLength(2);

            // Material attachment: 1 (week 1) + 3 (week 2) = 4 downloads, ranked first.
            expect(result[0]).toMatchObject({
                attachmentId: materialAttachmentId,
                name: "Material Attachment",
                downloadCount: 4,
                type: "material",
                contentId: materialId,
                contentTitle: "Material One",
                classSubjectId,
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name,
                },
                class: { id: classId, name: "XI-IPA-1" },
            });

            // Assignment attachment: 1 (week 1) download, ranked second.
            expect(result[1]).toMatchObject({
                attachmentId: assignmentAttachmentId,
                name: "Assignment Attachment",
                downloadCount: 1,
                type: "assignment",
                contentId: assignmentId,
                contentTitle: "Assignment One",
                classSubjectId,
                subject: {
                    id: subject.id,
                    code: subject.code,
                    name: subject.name,
                },
                class: { id: classId, name: "XI-IPA-1" },
            });
        });

        it("respects the limit parameter", async () => {
            const result = await repository.getTopDownloadedAttachments(
                teacher.userId,
                session.session,
                session.semester,
                1,
            );

            expect(result).toHaveLength(1);
            expect(result[0].attachmentId).toBe(materialAttachmentId);
            expect(result[0].downloadCount).toBe(4);
        });

        it("excludes attachments from a different session/semester and from another teacher's classes", async () => {
            const result = await repository.getTopDownloadedAttachments(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            const attachmentIds = result.map((r) => r.attachmentId);

            expect(attachmentIds).not.toContain(otherSessionAttachmentId);
            expect(attachmentIds).not.toContain(otherTeacherAttachmentId);
        });
    });

    describe("getSubmissionAnalyticsRawData", () => {
        // Classifying/aggregating submission status (on-time/late/missing/pending) is business logic
        // that lives in AnalyticsService, not here — see AnalyticsService.unit.test.ts for that. This
        // block only verifies that the repository fetches the right *raw* rows: the right assignments
        // (visible, teacher/session/semester scoped), the right roster (scoped to involved classes),
        // and the right submissions (scoped to involved assignments). This block seeds its own
        // classes/rosters/assignments, entirely separate from the download-analytics fixtures above.
        // The `teacher`, `session`, `otherSessionData`, `subject`, and `otherTeacherUserId` variables
        // are reused from the outer `beforeAll` to mirror the scoping-exclusion tests already written
        // for `getDownloadTimeSeries`/`getTopDownloadedAttachments` above.

        const dayMs = 24 * 60 * 60 * 1000;
        // Truncated to whole seconds: the `datetime` columns storing these values don't retain
        // sub-second precision, so comparing round-tripped values against a millisecond-precision
        // `Date` would spuriously fail.
        const pastDue = new Date(
            Math.floor((Date.now() - 7 * dayMs) / 1000) * 1000,
        );
        const submittedAt = new Date(pastDue.getTime() - dayMs);

        let stuAId: number;
        let stuBId: number;

        let classSubjectMainId: number;
        let classMainId: number;
        let visibleAssignmentId: number;

        async function seedStudent(identifier: string, name: string) {
            const user = await seeders.users.seedOne({
                active: true,
                name,
                password: testPasswordHash,
                role: UserRole.Student,
                identifier,
            });

            await seeders.students.seedOne({ userId: user.id! });

            return user.id!;
        }

        beforeAll(async () => {
            // --- Main class-subject: one visible assignment (stuA submits, stuB doesn't) and one
            // non-visible assignment, to verify the `visible` filter and the roster/submission shape.
            stuAId = await seedStudent("analytics-sard-stu-a", "SARD Student A");
            stuBId = await seedStudent("analytics-sard-stu-b", "SARD Student B");

            const clsMain = await seeders.classes.seedOne({
                name: "SARD-Main",
                session: session.session,
                semester: session.semester,
            });

            classMainId = clsMain.id!;

            const classSubjectMain = await seeders.classSubjects.seedOne({
                classId: classMainId,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            classSubjectMainId = classSubjectMain.id!;

            for (const studentId of [stuAId, stuBId]) {
                await seeders.studentClasses.seedOne({
                    classId: classMainId,
                    studentId,
                });
            }

            const visibleAssignment = await seeders.assignments.seedOne({
                classSubjectId: classSubjectMainId,
                title: "SARD Visible Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });

            visibleAssignmentId = visibleAssignment.id!;

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: visibleAssignmentId,
                studentId: stuAId,
                createdAt: submittedAt,
            });
            // stuB never submits.

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectMainId,
                title: "SARD Hidden Assignment",
                description: null,
                visible: false,
                dueAt: pastDue,
            });

            // --- A class-subject taught by the SAME teacher, but in a DIFFERENT session/semester --
            // to verify session/semester scoping exclusion. ---
            const clsOtherSession = await seeders.classes.seedOne({
                name: "SARD-OtherSession",
                session: otherSessionData.session,
                semester: otherSessionData.semester,
            });

            const classSubjectOtherSession = await seeders.classSubjects.seedOne(
                {
                    classId: clsOtherSession.id!,
                    subjectId: subject.id,
                    teacherId: teacher.userId,
                },
            );

            const stuOtherSessionId = await seedStudent(
                "analytics-sard-stu-other-session",
                "SARD Student Other Session",
            );

            await seeders.studentClasses.seedOne({
                classId: clsOtherSession.id!,
                studentId: stuOtherSessionId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectOtherSession.id!,
                title: "SARD Other Session Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });

            // --- A class-subject in the SAME session/semester, but taught by a DIFFERENT teacher --
            // to verify teacher scoping exclusion. ---
            const clsOtherTeacher = await seeders.classes.seedOne({
                name: "SARD-OtherTeacher",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectOtherTeacher = await seeders.classSubjects.seedOne(
                {
                    classId: clsOtherTeacher.id!,
                    subjectId: subject.id,
                    teacherId: otherTeacherUserId,
                },
            );

            const stuOtherTeacherId = await seedStudent(
                "analytics-sard-stu-other-teacher",
                "SARD Student Other Teacher",
            );

            await seeders.studentClasses.seedOne({
                classId: clsOtherTeacher.id!,
                studentId: stuOtherTeacherId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectOtherTeacher.id!,
                title: "SARD Other Teacher Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });
        });

        it("returns only visible assignments, with the correct class/subject shape", async () => {
            const result = await repository.getSubmissionAnalyticsRawData(
                teacher.userId,
                session.session,
                session.semester,
            );

            // The outer `beforeAll` above also seeds a visible assignment ("Assignment One") for
            // this same teacher/session, so assert on the specific assignment this block seeded
            // rather than the whole array.
            expect(result.assignments).toEqual(
                expect.arrayContaining([
                    {
                        assignmentId: visibleAssignmentId,
                        dueAt: pastDue,
                        classId: classMainId,
                        classSubjectId: classSubjectMainId,
                        subject: {
                            id: subject.id,
                            code: subject.code,
                            name: subject.name,
                        },
                        class: { id: classMainId, name: "SARD-Main" },
                    },
                ]),
            );

            // The non-visible sibling assignment must not appear at all.
            expect(
                result.assignments.some(
                    (a) =>
                        a.classSubjectId === classSubjectMainId &&
                        a.assignmentId !== visibleAssignmentId,
                ),
            ).toBe(false);
        });

        it("returns the full roster of classes with in-scope assignments, regardless of submission status", async () => {
            const result = await repository.getSubmissionAnalyticsRawData(
                teacher.userId,
                session.session,
                session.semester,
            );

            expect(result.roster).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        classId: classMainId,
                        studentId: stuAId,
                    }),
                    expect.objectContaining({
                        classId: classMainId,
                        studentId: stuBId,
                    }),
                ]),
            );

            expect(result.roster).toHaveLength(2);
        });

        it("returns submissions only for in-scope assignments", async () => {
            const result = await repository.getSubmissionAnalyticsRawData(
                teacher.userId,
                session.session,
                session.semester,
            );

            expect(result.submissions).toEqual([
                {
                    assignmentId: visibleAssignmentId,
                    studentId: stuAId,
                    submittedAt,
                },
            ]);
        });

        it("only returns data within the given session/semester", async () => {
            const otherSessionResult =
                await repository.getSubmissionAnalyticsRawData(
                    teacher.userId,
                    otherSessionData.session,
                    otherSessionData.semester,
                );

            expect(
                otherSessionResult.assignments.some(
                    (a) => a.classSubjectId === classSubjectMainId,
                ),
            ).toBe(false);

            const targetSessionResult =
                await repository.getSubmissionAnalyticsRawData(
                    teacher.userId,
                    session.session,
                    session.semester,
                );

            expect(
                targetSessionResult.assignments.some(
                    (a) => a.assignmentId === visibleAssignmentId,
                ),
            ).toBe(true);
        });

        it("only returns data for classes the given teacher teaches", async () => {
            const otherTeacherResult =
                await repository.getSubmissionAnalyticsRawData(
                    otherTeacherUserId,
                    session.session,
                    session.semester,
                );

            expect(
                otherTeacherResult.assignments.some(
                    (a) => a.classSubjectId === classSubjectMainId,
                ),
            ).toBe(false);

            const targetTeacherResult =
                await repository.getSubmissionAnalyticsRawData(
                    teacher.userId,
                    session.session,
                    session.semester,
                );

            expect(
                targetTeacherResult.assignments.some(
                    (a) => a.assignmentId === visibleAssignmentId,
                ),
            ).toBe(true);
        });

        it("returns empty assignments/roster/submissions when the teacher has no visible assignments in scope", async () => {
            const noAssignmentsTeacher = await seeders.users.seedOne({
                active: true,
                name: "SARD No Assignments Teacher",
                password: testPasswordHash,
                role: UserRole.Teacher,
                identifier: "analytics-sard-no-assignments-teacher",
            });

            await seeders.teachers.seedOne({ userId: noAssignmentsTeacher.id! });

            const result = await repository.getSubmissionAnalyticsRawData(
                noAssignmentsTeacher.id!,
                session.session,
                session.semester,
            );

            expect(result).toEqual({ assignments: [], roster: [], submissions: [] });
        });
    });
});
