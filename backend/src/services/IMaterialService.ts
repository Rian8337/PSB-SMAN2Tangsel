import { SubjectMaterial } from "@psb/shared/types";
import { TempFile } from "./IAttachmentService";

/**
 * A service that is responsible for handling operations related to materials.
 */
export interface IMaterialService {
    /**
     * Returns the details of a material for a student.
     *
     * Students can only view materials that are visible and belong to a class subject
     * in which they are enrolled.
     *
     * @param materialId The ID of the material.
     * @param studentId The ID of the student.
     * @returns The material details.
     * @throws {NotFoundError} If the material does not exist or is not accessible.
     */
    getStudentMaterial(
        materialId: number,
        studentId: number,
    ): Promise<SubjectMaterial>;

    /**
     * Returns the details of a material for a teacher.
     *
     * Teachers can view all materials (visible and hidden) belonging to class subjects
     * they are assigned to.
     *
     * @param materialId The ID of the material.
     * @param teacherId The ID of the teacher.
     * @returns The material details.
     * @throws {NotFoundError} If the material does not exist or is not accessible.
     */
    getTeacherMaterial(
        materialId: number,
        teacherId: number,
    ): Promise<SubjectMaterial>;

    /**
     * Returns the storage path and name of a material attachment for a student.
     *
     * @param materialId The ID of the material.
     * @param attachmentId The ID of the attachment.
     * @param studentId The ID of the student.
     * @returns The attachment's storage path and display name.
     * @throws {NotFoundError} If the attachment is not accessible.
     */
    getStudentAttachment(
        materialId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string }>;

    /**
     * Returns the storage path and name of a material attachment for a teacher.
     *
     * @param materialId The ID of the material.
     * @param attachmentId The ID of the attachment.
     * @param teacherId The ID of the teacher.
     * @returns The attachment's storage path and display name.
     * @throws {NotFoundError} If the attachment is not accessible.
     */
    getTeacherAttachment(
        materialId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string }>;

    /**
     * Creates a new material in a class subject.
     *
     * @param classSubjectId The ID of the class subject.
     * @param teacherId The ID of the teacher creating the material.
     * @param title The title of the material.
     * @param description The optional description.
     * @param visible Whether the material is immediately visible to students.
     * @param files Uploaded files to attach to the material.
     * @returns The created material.
     * @throws {NotFoundError} If the teacher is not assigned to the class subject.
     */
    addMaterial(
        classSubjectId: number,
        teacherId: number,
        title: string,
        description: string | null,
        visible: boolean,
        files: TempFile[],
    ): Promise<SubjectMaterial>;

    /**
     * Updates an existing material.
     *
     * @param materialId The ID of the material to update.
     * @param teacherId The ID of the requesting teacher.
     * @param title The new title.
     * @param description The new description.
     * @param visible The new visibility.
     * @param newFiles New files to upload and attach.
     * @param renamedAttachments Existing attachments to rename.
     * @param deletedAttachmentIds IDs of attachments to remove.
     * @throws {NotFoundError} If the material does not exist or the teacher does not own it.
     */
    updateMaterial(
        materialId: number,
        teacherId: number,
        title: string,
        description: string | null,
        visible: boolean,
        newFiles: TempFile[],
        renamedAttachments: { id: number; newName: string }[],
        deletedAttachmentIds: number[],
    ): Promise<void>;

    /**
     * Deletes a material and all its attachments.
     *
     * @param materialId The ID of the material to delete.
     * @param teacherId The ID of the requesting teacher.
     * @throws {NotFoundError} If the material does not exist or the teacher does not own it.
     */
    deleteMaterial(materialId: number, teacherId: number): Promise<void>;
}
