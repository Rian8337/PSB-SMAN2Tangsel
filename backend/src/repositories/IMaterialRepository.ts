import { SubjectMaterial } from "@psb/shared/types";

/**
 * Defines operations for accessing material data in the database.
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
}
