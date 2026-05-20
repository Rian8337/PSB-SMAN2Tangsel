import { SubjectDashboard } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { ISubjectDashboardAPIClient } from "./ISubjectDashboardAPIClient";

/**
 * Provides operations for subject dashboard API calls.
 */
export class SubjectDashboardAPIClient
    extends APIClient
    implements ISubjectDashboardAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/class-subjects";
    }

    getDashboard(
        classSubjectId: number,
        signal?: AbortSignal,
    ): Promise<SubjectDashboard> {
        return this.get(`/${classSubjectId.toString()}/dashboard`, {
            signal,
        }).then((res) => res.json());
    }
}
