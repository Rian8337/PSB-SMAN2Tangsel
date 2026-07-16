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

    describe("getSubmissionAnalytics", () => {
        // This block seeds its own classes/rosters/assignments, entirely separate from the
        // download-analytics fixtures above. Those fixtures seed no student rosters (no
        // `studentClasses` rows), so "Assignment One" above never contributes to any roster-based
        // classification here even though it is visible and in-scope for `teacher`/`session`. The
        // `teacher`, `session`, `otherSessionData`, `subject`, and `otherTeacherUserId` variables are
        // reused from the outer `beforeAll` to mirror the scoping-exclusion tests already written for
        // `getDownloadTimeSeries`/`getTopDownloadedAttachments` above.

        const dayMs = 24 * 60 * 60 * 1000;

        // Comfortably in the past/future relative to whenever the suite actually runs.
        const pastDue = new Date(Date.now() - 7 * dayMs);
        const submittedBeforeDue = new Date(pastDue.getTime() - dayMs);
        const submittedAfterDue = new Date(pastDue.getTime() + dayMs);
        const futureDue = new Date(Date.now() + 7 * dayMs);

        // Roster for the on-time / late / missing (past due) class-subject. stuC additionally
        // misses a second assignment there, making it the top concern (count 2) for the
        // concernLimit test.
        let stuAId: number;
        let stuBId: number;
        let stuCId: number;

        // Pending via a future due date.
        let stuDId: number;

        // On-time / pending via a null due date.
        let stuEId: number;
        let stuFId: number;

        // Non-visible-assignment exclusion.
        let stuGId: number;

        // The same student enrolled in two different class-subjects taught by the same teacher —
        // concerning in only one — to verify per-class-subject concern aggregation.
        let stuDualId: number;

        let classSubjectMixedId: number;
        let classSubjectDualAId: number;
        let classSubjectDualBId: number;

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
            // --- Class-subject 1: on-time, late, and missing (past due), across two assignments so
            // that stuC (always missing) ends up with the highest concern count (2). ---
            stuAId = await seedStudent("analytics-sa-stu-a", "SA Student A");
            stuBId = await seedStudent("analytics-sa-stu-b", "SA Student B");
            stuCId = await seedStudent("analytics-sa-stu-c", "SA Student C");

            const clsMixed = await seeders.classes.seedOne({
                name: "SA-Mixed",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectMixed = await seeders.classSubjects.seedOne({
                classId: clsMixed.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            classSubjectMixedId = classSubjectMixed.id!;

            for (const studentId of [stuAId, stuBId, stuCId]) {
                await seeders.studentClasses.seedOne({
                    classId: clsMixed.id!,
                    studentId,
                });
            }

            const mixedAssignment1 = await seeders.assignments.seedOne({
                classSubjectId: classSubjectMixedId,
                title: "SA Past Due Mixed 1",
                description: null,
                visible: true,
                dueAt: pastDue,
            });

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: mixedAssignment1.id!,
                studentId: stuAId,
                createdAt: submittedBeforeDue,
            });

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: mixedAssignment1.id!,
                studentId: stuBId,
                createdAt: submittedAfterDue,
            });
            // stuC never submits mixedAssignment1 -> missing (1st miss).

            const mixedAssignment2 = await seeders.assignments.seedOne({
                classSubjectId: classSubjectMixedId,
                title: "SA Past Due Mixed 2",
                description: null,
                visible: true,
                dueAt: pastDue,
            });

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: mixedAssignment2.id!,
                studentId: stuAId,
                createdAt: submittedBeforeDue,
            });

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: mixedAssignment2.id!,
                studentId: stuBId,
                createdAt: submittedBeforeDue,
            });
            // stuC never submits mixedAssignment2 either -> missing (2nd miss, total 2).

            // --- Class-subject 2: pending via a FUTURE due date. Must NOT be "missing" and must NOT
            // appear in concerningStudents. ---
            stuDId = await seedStudent("analytics-sa-stu-d", "SA Student D");

            const clsPendingFuture = await seeders.classes.seedOne({
                name: "SA-PendingFuture",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectPendingFuture = await seeders.classSubjects.seedOne(
                {
                    classId: clsPendingFuture.id!,
                    subjectId: subject.id,
                    teacherId: teacher.userId,
                },
            );

            await seeders.studentClasses.seedOne({
                classId: clsPendingFuture.id!,
                studentId: stuDId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectPendingFuture.id!,
                title: "SA Future Due",
                description: null,
                visible: true,
                dueAt: futureDue,
            });
            // stuD never submits -> pending (future due date).

            // --- Class-subject 3: on-time and pending via a NULL due date. ---
            stuEId = await seedStudent("analytics-sa-stu-e", "SA Student E");
            stuFId = await seedStudent("analytics-sa-stu-f", "SA Student F");

            const clsNullDue = await seeders.classes.seedOne({
                name: "SA-NullDue",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectNullDue = await seeders.classSubjects.seedOne({
                classId: clsNullDue.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            for (const studentId of [stuEId, stuFId]) {
                await seeders.studentClasses.seedOne({
                    classId: clsNullDue.id!,
                    studentId,
                });
            }

            const nullDueAssignment = await seeders.assignments.seedOne({
                classSubjectId: classSubjectNullDue.id!,
                title: "SA No Due Date",
                description: null,
                visible: true,
                dueAt: null,
            });

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: nullDueAssignment.id!,
                studentId: stuEId,
                createdAt: new Date(),
            });
            // stuE submitted (any time, no deadline) -> onTime.
            // stuF never submits -> pending (null due date, never "missing").

            // --- Class-subject 4: a NON-VISIBLE assignment, unsubmitted and past due (would look
            // like a "missing" entry if the `visible` filter were dropped). ---
            stuGId = await seedStudent("analytics-sa-stu-g", "SA Student G");

            const clsHidden = await seeders.classes.seedOne({
                name: "SA-Hidden",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectHidden = await seeders.classSubjects.seedOne({
                classId: clsHidden.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            await seeders.studentClasses.seedOne({
                classId: clsHidden.id!,
                studentId: stuGId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectHidden.id!,
                title: "SA Hidden Assignment",
                description: null,
                visible: false,
                dueAt: pastDue,
            });
            // stuG never submits; the assignment is hidden, so it must be excluded entirely.

            // --- Class-subjects 5 & 6: the same student enrolled in two different class-subjects
            // taught by the same teacher -- concerning in only one -- to verify that concern
            // aggregation is scoped per class-subject, not summed across the teacher's whole roster.
            stuDualId = await seedStudent(
                "analytics-sa-stu-dual",
                "SA Student Dual",
            );

            const clsDualA = await seeders.classes.seedOne({
                name: "SA-DualA",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectDualA = await seeders.classSubjects.seedOne({
                classId: clsDualA.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            classSubjectDualAId = classSubjectDualA.id!;

            await seeders.studentClasses.seedOne({
                classId: clsDualA.id!,
                studentId: stuDualId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectDualAId,
                title: "SA Dual A Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });
            // stuDual never submits -> missing, at classSubjectDualA.

            const clsDualB = await seeders.classes.seedOne({
                name: "SA-DualB",
                session: session.session,
                semester: session.semester,
            });

            const classSubjectDualB = await seeders.classSubjects.seedOne({
                classId: clsDualB.id!,
                subjectId: subject.id,
                teacherId: teacher.userId,
            });

            classSubjectDualBId = classSubjectDualB.id!;

            await seeders.studentClasses.seedOne({
                classId: clsDualB.id!,
                studentId: stuDualId,
            });

            const dualBAssignment = await seeders.assignments.seedOne({
                classSubjectId: classSubjectDualBId,
                title: "SA Dual B Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });

            await seeders.assignmentSubmissions.seedOne({
                assignmentId: dualBAssignment.id!,
                studentId: stuDualId,
                createdAt: submittedBeforeDue,
            });
            // stuDual submits on time -> onTime, at classSubjectDualB (no concern here).

            // --- A class-subject taught by the SAME teacher, but in a DIFFERENT session/semester --
            // to verify session/semester scoping exclusion. ---
            const clsOtherSession = await seeders.classes.seedOne({
                name: "SA-OtherSession",
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
                "analytics-sa-stu-other-session",
                "SA Student Other Session",
            );

            await seeders.studentClasses.seedOne({
                classId: clsOtherSession.id!,
                studentId: stuOtherSessionId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectOtherSession.id!,
                title: "SA Other Session Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });
            // Never submitted -> missing, but only within `otherSessionData`'s session/semester.

            // --- A class-subject in the SAME session/semester, but taught by a DIFFERENT teacher --
            // to verify teacher scoping exclusion. ---
            const clsOtherTeacher = await seeders.classes.seedOne({
                name: "SA-OtherTeacher",
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
                "analytics-sa-stu-other-teacher",
                "SA Student Other Teacher",
            );

            await seeders.studentClasses.seedOne({
                classId: clsOtherTeacher.id!,
                studentId: stuOtherTeacherId,
            });

            await seeders.assignments.seedOne({
                classSubjectId: classSubjectOtherTeacher.id!,
                title: "SA Other Teacher Assignment",
                description: null,
                visible: true,
                dueAt: pastDue,
            });
            // Never submitted -> missing, but only visible when querying as `otherTeacherUserId`.
        });

        // The full, deterministic summary for `teacher`/`session` across all fixtures seeded above:
        //   - classSubjectMixed: onTime 1+2=3, late 1, missing 1+1=2 (6 pairs, 3 students x 2 assignments)
        //   - classSubjectPendingFuture: pending 1
        //   - classSubjectNullDue: onTime 1, pending 1
        //   - classSubjectHidden: excluded entirely (not visible)
        //   - classSubjectDualA: missing 1
        //   - classSubjectDualB: onTime 1
        //   - otherSession / otherTeacher class-subjects: excluded by scoping
        // Totals: onTime 3+1+1=5, late 1, missing 2+1=3, pending 1+1=2.
        const expectedSummary = {
            onTime: 5,
            late: 1,
            missing: 3,
            pending: 2,
        };

        it("classifies on-time, late, missing (past due), and pending (future due / null due) submissions across a teacher's visible assignments", async () => {
            const result = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            expect(result.summary).toEqual(expectedSummary);
        });

        it("does not classify pending submissions (future due or null due, unsubmitted) as missing, and excludes them from concerningStudents", async () => {
            const result = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            const concernedStudentIds = result.concerningStudents.map(
                (c) => c.studentId,
            );

            expect(concernedStudentIds).not.toContain(stuDId);
            expect(concernedStudentIds).not.toContain(stuFId);
        });

        it("excludes non-visible assignments from the summary and concerningStudents, even when their unsubmitted, past-due state would otherwise look like a miss", async () => {
            const result = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            // If the `visible` filter were dropped, stuG's hidden-but-past-due assignment would add
            // 1 to `missing` and a concern entry -- neither happens.
            expect(result.summary).toEqual(expectedSummary);

            expect(
                result.concerningStudents.some((c) => c.studentId === stuGId),
            ).toBe(false);
        });

        it("only counts submissions within the given session/semester", async () => {
            const otherSessionResult = await repository.getSubmissionAnalytics(
                teacher.userId,
                otherSessionData.session,
                otherSessionData.semester,
                10,
            );

            expect(otherSessionResult.summary).toEqual({
                onTime: 0,
                late: 0,
                missing: 1,
                pending: 0,
            });

            const targetSessionResult = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            expect(targetSessionResult.summary).toEqual(expectedSummary);
        });

        it("only counts submissions for classes the given teacher teaches", async () => {
            const otherTeacherResult = await repository.getSubmissionAnalytics(
                otherTeacherUserId,
                session.session,
                session.semester,
                10,
            );

            expect(otherTeacherResult.summary).toEqual({
                onTime: 0,
                late: 0,
                missing: 1,
                pending: 0,
            });

            const targetTeacherResult = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            expect(targetTeacherResult.summary).toEqual(expectedSummary);
        });

        it("aggregates concerningStudents per class-subject (not summed across the teacher's whole roster), sorted by severity, and respects concernLimit", async () => {
            const fullResult = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                10,
            );

            expect(fullResult.concerningStudents).toHaveLength(3);

            // stuC has 2 misses at classSubjectMixed -> the top concern.
            expect(fullResult.concerningStudents[0]).toMatchObject({
                studentId: stuCId,
                classSubjectId: classSubjectMixedId,
                lateCount: 0,
                missingCount: 2,
            });

            expect(fullResult.concerningStudents).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        studentId: stuBId,
                        classSubjectId: classSubjectMixedId,
                        lateCount: 1,
                        missingCount: 0,
                    }),
                    expect.objectContaining({
                        studentId: stuDualId,
                        classSubjectId: classSubjectDualAId,
                        lateCount: 0,
                        missingCount: 1,
                    }),
                ]),
            );

            // stuDual must NOT have a phantom concern entry for classSubjectDualB, where it only
            // submitted on time.
            expect(
                fullResult.concerningStudents.some(
                    (c) =>
                        c.studentId === stuDualId &&
                        c.classSubjectId === classSubjectDualBId,
                ),
            ).toBe(false);

            const limitedResult = await repository.getSubmissionAnalytics(
                teacher.userId,
                session.session,
                session.semester,
                1,
            );

            expect(limitedResult.concerningStudents).toHaveLength(1);
            expect(limitedResult.concerningStudents[0]).toMatchObject({
                studentId: stuCId,
                classSubjectId: classSubjectMixedId,
            });
        });
    });
});
