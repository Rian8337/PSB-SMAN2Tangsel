import { SubjectMaterial } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { ISubjectMaterialAPIClient } from "./ISubjectMaterialAPIClient";

/**
 * Provides operations for subject material API calls.
 */
export class SubjectMaterialAPIClient
    extends APIClient
    implements ISubjectMaterialAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/materials";
    }

    async getMaterial(materialId: number, signal?: AbortSignal): Promise<SubjectMaterial> {
        const res = await this.get(`/${materialId.toString()}`, { signal });
        return res.json();
    }
}
