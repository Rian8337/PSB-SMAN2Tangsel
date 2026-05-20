import { ClassSubjectRepository } from "@/repositories";
import { classes, classSubjects, materials } from "@psb/shared/schema";
import { seededPrimaryData } from "@psb/shared/tests";
import { ClassSubjectAssignment } from "@psb/shared/types";
import { seeders, testDb, testDbManager } from "@test/utils";
import { eq } from "drizzle-orm";

describe("ClassSubjectRepository (integration)", () => {
    const repository = new ClassSubjectRepository(testDb);

    const session = seededPrimaryData.sessions[0];
    const teacher = seededPrimaryData.teachers[0];

    const userTeacher = seededPrimaryData.users.find(
        (u) => u.id === teacher.userId,
    )!;

    const subject1 = seededPrimaryData.subjects[0];
    const subject2 = seededPrimaryData.subjects[1];

    let readOnlyClass: typeof classes.$inferInsert;
    let readOnlyClassSubject: typeof classSubjects.$inferInsert;
    let mutableClassSubject: typeof classSubjects.$inferInsert;

    beforeAll(async () => {
        // For read operations
        readOnlyClass = await seeders.classes.seedOne({
            name: "Read-Only Class",
            session: session.session,
            semester: session.semester,
        });

        readOnlyClassSubject = await seeders.classSubjects.seedOne({
            classId: readOnlyClass.id!,
            subjectId: subject1.id,
            teacherId: teacher.userId,
        });

        // For write operations
        const mutableClass = await seeders.classes.seedOne({
            name: "Mutable Class",
            session: session.session,
            semester: session.semester,
        });

        mutableClassSubject = await seeders.classSubjects.seedOne({
            classId: mutableClass.id!,
            subjectId: subject1.id,
            teacherId: teacher.userId,
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("listAssignedSubjects", () => {
        it("should return the correctly joined subject and teacher data", async () => {
            const assigned = await repository.listAssignedSubjects(
                readOnlyClassSubject.classId,
            );

            expect(assigned).toHaveLength(1);

            expect(assigned[0]).toMatchObject({
                id: readOnlyClassSubject.id!,
                subject: {
                    id: subject1.id,
                    code: subject1.code,
                    name: subject1.name,
                },
                class: {
                    id: readOnlyClassSubject.classId,
                    name: readOnlyClass.name,
                },
                teacher: {
                    id: teacher.userId,
                    name: userTeacher.name,
                },
            } satisfies ClassSubjectAssignment);
        });

        it("should return an empty array if the class has no assignments", async () => {
            const assigned = await repository.listAssignedSubjects(999);

            expect(assigned).toHaveLength(0);
        });

        it("should correctly filter results by search query (subject name)", async () => {
            const assigned = await repository.listAssignedSubjects(
                readOnlyClassSubject.classId,
                "Wajib",
            );

            expect(assigned).toHaveLength(1);

            const emptySearch = await repository.listAssignedSubjects(
                readOnlyClassSubject.classId,
                "Sejarah",
            );

            expect(emptySearch).toHaveLength(0);
        });
    });

    describe("listAssignedSubjectsForTeacher", () => {
        it("should return the correctly mapped subject and class data for the teacher", async () => {
            const assigned = await repository.listAssignedSubjectsForTeacher(
                teacher.userId,
                session.session,
                session.semester,
            );

            expect(assigned.length).toBeGreaterThanOrEqual(2);

            const match = assigned.find(
                (a) => a.id === readOnlyClassSubject.id,
            );

            expect(match).toBeDefined();

            expect(match).toMatchObject({
                id: readOnlyClassSubject.id!,
                subject: {
                    id: subject1.id,
                    code: subject1.code,
                    name: subject1.name,
                },
                class: {
                    id: readOnlyClass.id,
                    name: readOnlyClass.name,
                },
            });
        });

        it("should return an empty array if the teacher has no assignments in the session/semester", async () => {
            const assigned = await repository.listAssignedSubjectsForTeacher(
                teacher.userId,
                "2000/2001",
                1,
            );

            expect(assigned).toHaveLength(0);
        });

        it("should correctly filter results by search query (subject or class name)", async () => {
            const assigned = await repository.listAssignedSubjectsForTeacher(
                teacher.userId,
                session.session,
                session.semester,
                "Read-Only",
            );

            expect(assigned).toHaveLength(1);
            expect(assigned[0].class.name).toBe(readOnlyClass.name);

            const byCode = await repository.listAssignedSubjectsForTeacher(
                teacher.userId,
                session.session,
                session.semester,
                subject1.code,
            );

            expect(byCode.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("listUnassignedSubjects", () => {
        it("should return subjects that are NOT assigned to the class", async () => {
            const unassigned = await repository.listUnassignedSubjects(
                readOnlyClassSubject.classId,
            );

            // Subject 1 is assigned, so it should not be returned.
            const hasSubject1 = unassigned.some((s) => s.id === subject1.id);
            expect(hasSubject1).toBe(false);

            // Subject 2 is unassigned, so it should be returned.
            const hasSubject2 = unassigned.some((s) => s.id === subject2.id);
            expect(hasSubject2).toBe(true);
        });

        it("should correctly filter unassigned subjects by search query", async () => {
            const unassigned = await repository.listUnassignedSubjects(
                readOnlyClassSubject.classId,
                "Peminatan",
            );

            expect(unassigned).toHaveLength(1);
            expect(unassigned[0].id).toBe(subject2.id);
        });
    });

    describe("assignSubject", () => {
        it("should insert a new class-subject assignment into the database", async () => {
            await repository.assignSubject(
                mutableClassSubject.classId,
                subject2.id,
                null,
            );

            const dbRecords = await testDb
                .select()
                .from(classSubjects)
                .where(eq(classSubjects.subjectId, subject2.id));

            const newAssignment = dbRecords.find(
                (r) => r.classId === mutableClassSubject.classId,
            );

            expect(newAssignment).toBeDefined();
            expect(newAssignment).toMatchObject({
                classId: mutableClassSubject.classId,
                subjectId: subject2.id,
                teacherId: null,
            });
        });
    });

    describe("updateAssignedSubject", () => {
        it("should update the teacher ID to null for an existing assignment", async () => {
            await repository.updateAssignedSubject(
                mutableClassSubject.classId,
                mutableClassSubject.id!,
                null,
            );

            const dbRecords = await testDb
                .select()
                .from(classSubjects)
                .where(eq(classSubjects.id, mutableClassSubject.id!));

            expect(dbRecords[0].teacherId).toBeNull();
        });
    });

    describe("hasAssociatedContent", () => {
        it("should return false if there are no materials or assignments", async () => {
            const hasContent = await repository.hasAssociatedContent(
                mutableClassSubject.id!,
            );

            expect(hasContent).toBe(false);
        });

        it("should return true if there is an associated material", async () => {
            const material = await seeders.materials.seedOne({
                classSubjectId: mutableClassSubject.id!,
                title: "Test Material",
            });

            const hasContent = await repository.hasAssociatedContent(
                mutableClassSubject.id!,
            );

            expect(hasContent).toBe(true);

            // Clean up for the next test.
            await testDb
                .delete(materials)
                .where(eq(materials.id, material.id!));
        });

        it("should return true if there is an associated assignment", async () => {
            await seeders.assignments.seedOne({
                classSubjectId: mutableClassSubject.id!,
                title: "Test Assignment",
            });

            const hasContent = await repository.hasAssociatedContent(
                mutableClassSubject.id!,
            );

            expect(hasContent).toBe(true);
        });
    });

    describe("unassignSubject", () => {
        it("should delete the assignment from the database", async () => {
            await repository.unassignSubject(
                readOnlyClassSubject.classId,
                readOnlyClassSubject.id!,
            );

            const dbRecords = await testDb
                .select()
                .from(classSubjects)
                .where(eq(classSubjects.id, readOnlyClassSubject.id!));

            expect(dbRecords).toHaveLength(0);
        });
    });

    describe("getStudentDashboard", () => {
        const student = seededPrimaryData.users.find(
            (u) => u.id === seededPrimaryData.students[0].userId,
        )!;

        let dashboardClassSubject: typeof classSubjects.$inferInsert;

        beforeAll(async () => {
            const dashboardClass = await seeders.classes.seedOne({
                name: "Student Dashboard Class",
                session: session.session,
                semester: session.semester,
            });

            await seeders.studentClasses.seedOne({
                classId: dashboardClass.id!,
                studentId: student.id,
            });

            dashboardClassSubject = await seeders.classSubjects.seedOne({
                classId: dashboardClass.id!,
                subjectId: subject1.id,
                teacherId: teacher.userId,
            });

            await seeders.materials.seedMany(
                {
                    classSubjectId: dashboardClassSubject.id!,
                    title: "Visible Material",
                    visible: true,
                },
                {
                    classSubjectId: dashboardClassSubject.id!,
                    title: "Hidden Material",
                    visible: false,
                },
            );

            await seeders.assignments.seedMany(
                {
                    classSubjectId: dashboardClassSubject.id!,
                    title: "Visible Assignment",
                    visible: true,
                },
                {
                    classSubjectId: dashboardClassSubject.id!,
                    title: "Hidden Assignment",
                    visible: false,
                },
            );
        });

        it("should return the dashboard with only visible items for an enrolled student", async () => {
            const result = (await repository.getStudentDashboard(
                dashboardClassSubject.id!,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.subject.id).toBe(subject1.id);
            expect(result.class.id).toBe(dashboardClassSubject.classId);

            expect(result.materials).toHaveLength(1);
            expect(result.materials[0].title).toBe("Visible Material");
            expect(result.materials[0].visible).toBe(true);

            expect(result.assignments).toHaveLength(1);
            expect(result.assignments[0].title).toBe("Visible Assignment");
        });

        it("should return null if the student is not enrolled in the class", async () => {
            const unenrolledStudentId = seededPrimaryData.students[1].userId;

            const result = await repository.getStudentDashboard(
                dashboardClassSubject.id!,
                unenrolledStudentId,
            );

            expect(result).toBeNull();
        });

        it("should return null for a non-existent class subject ID", async () => {
            const result = await repository.getStudentDashboard(
                99999,
                student.id,
            );

            expect(result).toBeNull();
        });
    });

    describe("getTeacherDashboard", () => {
        let dashboardClassSubject: typeof classSubjects.$inferInsert;

        beforeAll(async () => {
            const dashboardClass = await seeders.classes.seedOne({
                name: "Teacher Dashboard Class",
                session: session.session,
                semester: session.semester,
            });

            dashboardClassSubject = await seeders.classSubjects.seedOne({
                classId: dashboardClass.id!,
                subjectId: subject1.id,
                teacherId: teacher.userId,
            });

            await seeders.materials.seedMany(
                {
                    classSubjectId: dashboardClassSubject.id!,
                    title: "Visible Material",
                    visible: true,
                },
                {
                    classSubjectId: dashboardClassSubject.id!,
                    title: "Hidden Material",
                    visible: false,
                },
            );

            await seeders.assignments.seedOne({
                classSubjectId: dashboardClassSubject.id!,
                title: "Teacher Assignment",
                visible: false,
            });
        });

        it("should return the dashboard with all items (including hidden) for an assigned teacher", async () => {
            const result = (await repository.getTeacherDashboard(
                dashboardClassSubject.id!,
                teacher.userId,
            ))!;

            expect(result).not.toBeNull();
            expect(result.subject.id).toBe(subject1.id);

            // Both visible and hidden materials should appear.
            expect(result.materials).toHaveLength(2);

            const titles = result.materials.map((m) => m.title);
            expect(titles).toContain("Visible Material");
            expect(titles).toContain("Hidden Material");

            // Hidden assignment should also appear.
            expect(result.assignments).toHaveLength(1);
            expect(result.assignments[0].title).toBe("Teacher Assignment");
        });

        it("should return null if the teacher is not assigned to the class subject", async () => {
            const otherTeacherId = 999;

            const result = await repository.getTeacherDashboard(
                dashboardClassSubject.id!,
                otherTeacherId,
            );

            expect(result).toBeNull();
        });

        it("should return null for a non-existent class subject ID", async () => {
            const result = await repository.getTeacherDashboard(
                99999,
                teacher.userId,
            );

            expect(result).toBeNull();
        });
    });
});
