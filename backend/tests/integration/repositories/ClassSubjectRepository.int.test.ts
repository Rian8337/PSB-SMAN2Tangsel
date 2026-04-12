import { ClassSubjectRepository } from "@/repositories";
import { classSubjects, materials } from "@psb/shared/schema";
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

    let readOnlyClassSubject: typeof classSubjects.$inferInsert;
    let mutableClassSubject: typeof classSubjects.$inferInsert;

    beforeAll(async () => {
        // For read operations
        const readOnlyClass = await seeders.classes.seedOne({
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
            await repository.unassignSubject(readOnlyClassSubject.id!);

            const dbRecords = await testDb
                .select()
                .from(classSubjects)
                .where(eq(classSubjects.id, readOnlyClassSubject.id!));

            expect(dbRecords).toHaveLength(0);
        });
    });
});
