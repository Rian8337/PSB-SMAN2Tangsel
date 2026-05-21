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

    getMaterial(
        materialId: number,
        signal?: AbortSignal,
    ): Promise<SubjectMaterial> {
        return this.get(`/${materialId.toString()}`, { signal }).then((res) =>
            res.json(),
        );
    }
}
