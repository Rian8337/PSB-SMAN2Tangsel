import { MaterialBookmarkRepository } from "@/repositories/MaterialBookmarkRepository";
import { seededPrimaryData } from "@psb/shared/tests";
import { seeders, testDb, testDbManager } from "@test/utils";

const repository = new MaterialBookmarkRepository(testDb);

const student = seededPrimaryData.users.find(
    (u) => u.identifier === "0012345678",
)!;
const teacher = seededPrimaryData.users.find((u) => u.identifier === "2")!;
const session = seededPrimaryData.sessions[0];
const subject = seededPrimaryData.subjects[0];

let classSubjectId: number;
let otherClassSubjectId: number;
let materialId: number;
let otherMaterialId: number;

beforeAll(async () => {
    const cls = await seeders.classes.seedOne({
        name: "X-BOOKMARK-1",
        session: session.session,
        semester: session.semester,
    });

    const otherCls = await seeders.classes.seedOne({
        name: "X-BOOKMARK-2",
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
        teacherId: teacher.id,
    });

    const otherClassSubject = await seeders.classSubjects.seedOne({
        classId: otherCls.id!,
        subjectId: subject.id,
        teacherId: teacher.id,
    });

    classSubjectId = classSubject.id!;
    otherClassSubjectId = otherClassSubject.id!;

    const material = await seeders.materials.seedOne({
        classSubjectId,
        title: "Bookmarkable Material",
        visible: true,
    });

    const otherMaterial = await seeders.materials.seedOne({
        classSubjectId: otherClassSubjectId,
        title: "Other Material",
        visible: true,
    });

    materialId = material.id!;
    otherMaterialId = otherMaterial.id!;
});

afterAll(testDbManager.cleanupSecondaryTables);

describe("add", () => {
    it("should create a bookmark", async () => {
        await repository.add(student.id, materialId);

        const ids = await repository.findBookmarkedMaterialIds(
            student.id,
            classSubjectId,
        );

        expect(ids).toContain(materialId);

        await repository.remove(student.id, materialId);
    });

    it("should be idempotent when bookmarking an already-bookmarked material", async () => {
        await repository.add(student.id, materialId);

        await expect(
            repository.add(student.id, materialId),
        ).resolves.not.toThrow();

        const ids = await repository.findBookmarkedMaterialIds(
            student.id,
            classSubjectId,
        );

        expect(ids.filter((id) => id === materialId)).toHaveLength(1);

        await repository.remove(student.id, materialId);
    });
});

describe("remove", () => {
    it("should delete an existing bookmark", async () => {
        await repository.add(student.id, materialId);
        await repository.remove(student.id, materialId);

        const ids = await repository.findBookmarkedMaterialIds(
            student.id,
            classSubjectId,
        );

        expect(ids).not.toContain(materialId);
    });

    it("should not throw when removing a non-existent bookmark", async () => {
        await expect(
            repository.remove(student.id, materialId),
        ).resolves.not.toThrow();
    });
});

describe("findBookmarkedMaterialIds", () => {
    it("should only return materials bookmarked by the given user within the given class subject", async () => {
        await seeders.materialBookmarks.seedOne({
            userId: student.id,
            materialId,
        });

        await seeders.materialBookmarks.seedOne({
            userId: student.id,
            materialId: otherMaterialId,
        });

        await seeders.materialBookmarks.seedOne({
            userId: teacher.id,
            materialId,
        });

        const ids = await repository.findBookmarkedMaterialIds(
            student.id,
            classSubjectId,
        );

        expect(ids).toEqual([materialId]);

        await seeders.materialBookmarks.deleteWhere({ userId: student.id });
        await seeders.materialBookmarks.deleteWhere({ userId: teacher.id });
    });
});

describe("findByUserForSession", () => {
    it("should only return bookmarks within the given session and semester, most recent first", async () => {
        await seeders.materialBookmarks.seedOne({
            userId: student.id,
            materialId,
        });

        await seeders.materialBookmarks.seedOne({
            userId: student.id,
            materialId: otherMaterialId,
        });

        const rows = await repository.findByUserForSession(
            student.id,
            session.session,
            session.semester,
            10,
            0,
        );

        expect(rows.map((r) => r.materialId)).toEqual([
            otherMaterialId,
            materialId,
        ]);

        expect(rows[0].subject.code).toBe(subject.code);
        expect(rows[0].class.name).toBe("X-BOOKMARK-2");

        await seeders.materialBookmarks.deleteWhere({ userId: student.id });
    });

    it("should respect limit and offset", async () => {
        await seeders.materialBookmarks.seedOne({
            userId: student.id,
            materialId,
        });

        await seeders.materialBookmarks.seedOne({
            userId: student.id,
            materialId: otherMaterialId,
        });

        const firstPage = await repository.findByUserForSession(
            student.id,
            session.session,
            session.semester,
            1,
            0,
        );

        const secondPage = await repository.findByUserForSession(
            student.id,
            session.session,
            session.semester,
            1,
            1,
        );

        expect(firstPage).toHaveLength(1);
        expect(secondPage).toHaveLength(1);
        expect(firstPage[0].materialId).not.toBe(secondPage[0].materialId);

        await seeders.materialBookmarks.deleteWhere({ userId: student.id });
    });
});
