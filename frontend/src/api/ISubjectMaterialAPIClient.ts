import { SubjectMaterial } from "@psb/shared/types";

/**
 * Provides operations for subject material API calls.
 */
export interface ISubjectMaterialAPIClient {
    /**
     * Obtains the subject material for the currently authenticated user.
     *
     * @param materialId The unique identifier of the material.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns The subject material for the given material ID.
     */
    getMaterial(
        materialId: number,
        signal?: AbortSignal,
    ): Promise<SubjectMaterial>;

    /**
     * Creates a new material. Sends multipart form data.
     *
     * @param data A {@link FormData} object with the material fields and optional file attachments.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns The created material.
     */
    createMaterial(
        data: FormData,
        signal?: AbortSignal,
    ): Promise<SubjectMaterial>;

    /**
     * Updates an existing material. Sends multipart form data.
     *
     * @param materialId The unique identifier of the material to update.
     * @param data A {@link FormData} object with updated fields and optional new file attachments.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     */
    updateMaterial(
        materialId: number,
        data: FormData,
        signal?: AbortSignal,
    ): Promise<void>;

    /**
     * Deletes a material and all its attachments.
     *
     * @param materialId The unique identifier of the material to delete.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     */
    deleteMaterial(materialId: number, signal?: AbortSignal): Promise<void>;
}
