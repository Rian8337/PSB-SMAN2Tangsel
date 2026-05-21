import { SubjectMaterial } from "@psb/shared/types";

/**
 * A service that is responsible for handling operations related to material viewing.
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
}
