import { SubjectMaterial } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing material data in the database.
 */
export interface IMaterialRepository {
    /**
     * Returns a material's details if the material is visible and the student is enrolled
     * in the class subject that contains it.
     *
     * @param materialId The ID of the material.
     * @param studentId The ID of the student.
     * @returns The material, or null if not found or not accessible.
     */
    getStudentMaterial(
        materialId: number,
        studentId: number,
    ): Promise<SubjectMaterial | null>;

    /**
     * Returns a material's details if the teacher is assigned to the class subject that contains it.
     *
     * @param materialId The ID of the material.
     * @param teacherId The ID of the teacher.
     * @returns The material, or null if not found or not accessible.
     */
    getTeacherMaterial(
        materialId: number,
        teacherId: number,
    ): Promise<SubjectMaterial | null>;

    /**
     * Returns the storage path and name of an attachment if the attachment belongs to the given
     * material and the student has access to it (material is visible and student is enrolled).
     *
     * @param materialId The ID of the material.
     * @param attachmentId The ID of the attachment.
     * @param studentId The ID of the student.
     * @returns The attachment path and name, or null if not accessible.
     */
    getStudentAttachment(
        materialId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string } | null>;

    /**
     * Returns the storage path and name of an attachment if the attachment belongs to the given
     * material and the teacher is assigned to its class subject.
     *
     * @param materialId The ID of the material.
     * @param attachmentId The ID of the attachment.
     * @param teacherId The ID of the teacher.
     * @returns The attachment path and name, or null if not accessible.
     */
    getTeacherAttachment(
        materialId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string } | null>;

    /**
     * Creates a new material and links it to the given attachments.
     *
     * @param classSubjectId The ID of the class subject the material belongs to.
     * @param title The title of the material.
     * @param description The optional description of the material.
     * @param visible Whether the material is visible to students.
     * @param attachmentIds The IDs of the attachments to link.
     * @returns The created material.
     */
    addMaterial(
        classSubjectId: number,
        title: string,
        description: string | null,
        visible: boolean,
        attachmentIds: number[],
    ): Promise<SubjectMaterial>;

    /**
     * Updates the title, description, visibility, and attachment links for a material.
     *
     * @param materialId The ID of the material to update.
     * @param title The new title.
     * @param description The new description.
     * @param visible The new visibility.
     * @param attachmentIds The full list of attachment IDs that the material should be linked to after the update.
     */
    updateMaterial(
        materialId: number,
        title: string,
        description: string | null,
        visible: boolean,
        attachmentIds: number[],
    ): Promise<void>;

    /**
     * Deletes a material by ID.
     *
     * @param materialId The ID of the material to delete.
     */
    deleteMaterial(materialId: number): Promise<void>;

    /**
     * Returns the attachment IDs linked to a material.
     *
     * @param materialId The ID of the material.
     * @returns An array of attachment IDs.
     */
    getMaterialAttachmentIds(materialId: number): Promise<number[]>;
}
