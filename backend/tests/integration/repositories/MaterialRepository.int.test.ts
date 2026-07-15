import { MaterialRepository } from "@/repositories/MaterialRepository";
import { seededPrimaryData } from "@psb/shared/tests";
import { seeders, testDb, testDbManager } from "@test/utils";

describe("MaterialRepository (integration)", () => {
    const repository = new MaterialRepository(testDb);

    const session = seededPrimaryData.sessions[0];
    const subject = seededPrimaryData.subjects[0];
    const student = seededPrimaryData.users.find(
        (u) => u.id === seededPrimaryData.students[0].userId,
    )!;
    const teacher = seededPrimaryData.teachers[0];
    const seededAttachment = seededPrimaryData.attachments[0];

    let classSubjectId: number;
    let visibleMaterialId: number;
    let hiddenMaterialId: number;

    beforeAll(async () => {
        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-1",
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

        classSubjectId = classSubject.id!;

        const visibleMaterial = await seeders.materials.seedOne({
            classSubjectId,
            title: "Visible Material",
            description: "A visible material",
            visible: true,
        });

        visibleMaterialId = visibleMaterial.id!;

        const hiddenMaterial = await seeders.materials.seedOne({
            classSubjectId,
            title: "Hidden Material",
            description: null,
            visible: false,
        });

        hiddenMaterialId = hiddenMaterial.id!;

        await seeders.materialAttachments.seedOne({
            materialId: visibleMaterialId,
            attachmentId: seededAttachment.id,
        });
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("getStudentMaterial", () => {
        it("should return null when the student is not enrolled in the class", async () => {
            const result = await repository.getStudentMaterial(
                visibleMaterialId,
                seededPrimaryData.students[1].userId,
            );

            expect(result).toBeNull();
        });

        it("should return null for a hidden material even when the student is enrolled", async () => {
            const result = await repository.getStudentMaterial(
                hiddenMaterialId,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return the material with attachments for a visible material and enrolled student", async () => {
            const result = (await repository.getStudentMaterial(
                visibleMaterialId,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.id).toBe(visibleMaterialId);
            expect(result.classSubjectId).toBe(classSubjectId);
            expect(result.title).toBe("Visible Material");
            expect(result.description).toBe("A visible material");
            expect(result.visible).toBe(true);
            expect(result.subject.id).toBe(subject.id);
            expect(result.subject.code).toBe(subject.code);
            expect(result.subject.name).toBe(subject.name);
            expect(typeof result.createdAt).toBe("string");
            expect(typeof result.lastUpdatedAt).toBe("string");
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].id).toBe(seededAttachment.id);
            expect(result.attachments[0].name).toBe(seededAttachment.name);
            expect(result.attachments[0].downloadCount).toBe(0);
        });

        it("should reflect the correct download count after downloads are recorded", async () => {
            const countAttachment = await seeders.attachments.seedOne({
                name: "Download Count Attachment",
                path: "download_count_attachment.txt",
            });

            const countMaterial = await seeders.materials.seedOne({
                classSubjectId,
                title: "Download Count Material",
                visible: true,
            });

            await seeders.materialAttachments.seedOne({
                materialId: countMaterial.id!,
                attachmentId: countAttachment.id!,
            });

            await seeders.attachmentDownloads.seedOne({
                attachmentId: countAttachment.id!,
                userId: student.id,
            });

            await seeders.attachmentDownloads.seedOne({
                attachmentId: countAttachment.id!,
                userId: student.id,
            });

            const result = (await repository.getStudentMaterial(
                countMaterial.id!,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].downloadCount).toBe(2);
        });

        it("should return the material with no attachments for a material without attachments", async () => {
            const visibleNoAttachment = await seeders.materials.seedOne({
                classSubjectId,
                title: "No Attachment Material",
                visible: true,
            });

            const result = (await repository.getStudentMaterial(
                visibleNoAttachment.id!,
                student.id,
            ))!;

            expect(result).not.toBeNull();
            expect(result.attachments).toHaveLength(0);
        });
    });

    describe("getTeacherMaterial", () => {
        it("should return null when the teacher is not assigned to the class subject", async () => {
            const result = await repository.getTeacherMaterial(
                visibleMaterialId,
                seededPrimaryData.students[0].userId,
            );

            expect(result).toBeNull();
        });

        it("should return a visible material for an assigned teacher", async () => {
            const result = (await repository.getTeacherMaterial(
                visibleMaterialId,
                teacher.userId,
            ))!;

            expect(result).not.toBeNull();
            expect(result.id).toBe(visibleMaterialId);
            expect(result.visible).toBe(true);
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0].downloadCount).toBe(0);
        });

        it("should return a hidden material for an assigned teacher", async () => {
            const result = await repository.getTeacherMaterial(
                hiddenMaterialId,
                teacher.userId,
            );

            expect(result).not.toBeNull();
            expect(result!.id).toBe(hiddenMaterialId);
            expect(result!.visible).toBe(false);
            expect(result!.attachments).toHaveLength(0);
        });
    });

    describe("getStudentAttachment", () => {
        it("should return null when the attachment does not belong to the material", async () => {
            const result = await repository.getStudentAttachment(
                hiddenMaterialId,
                seededAttachment.id,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return null when the material is hidden", async () => {
            const result = await repository.getStudentAttachment(
                hiddenMaterialId,
                seededAttachment.id,
                student.id,
            );

            expect(result).toBeNull();
        });

        it("should return the attachment path and name for an enrolled student on a visible material", async () => {
            const result = await repository.getStudentAttachment(
                visibleMaterialId,
                seededAttachment.id,
                student.id,
            );

            expect(result).not.toBeNull();
            expect(result!.path).toBe(seededAttachment.path);
            expect(result!.name).toBe(seededAttachment.name);
        });
    });

    describe("getTeacherAttachment", () => {
        it("should return null when the attachment does not belong to the material", async () => {
            const result = await repository.getTeacherAttachment(
                hiddenMaterialId,
                seededAttachment.id,
                teacher.userId,
            );

            expect(result).toBeNull();
        });

        it("should return the attachment for a hidden material when teacher is assigned", async () => {
            // The seeded attachment is on the visible material; seed a new one on hidden for this test.
            const extraAttachment = await seeders.attachments.seedOne({
                name: "Extra Attachment",
                path: "extra_attachment.txt",
            });

            await seeders.materialAttachments.seedOne({
                materialId: hiddenMaterialId,
                attachmentId: extraAttachment.id!,
            });

            const result = await repository.getTeacherAttachment(
                hiddenMaterialId,
                extraAttachment.id!,
                teacher.userId,
            );

            expect(result).not.toBeNull();
            expect(result!.path).toBe("extra_attachment.txt");
        });

        it("should return null when the teacher is not assigned to the class subject", async () => {
            const result = await repository.getTeacherAttachment(
                visibleMaterialId,
                seededAttachment.id,
                seededPrimaryData.students[0].userId,
            );

            expect(result).toBeNull();
        });
    });
});
