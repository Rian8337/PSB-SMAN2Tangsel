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
}
