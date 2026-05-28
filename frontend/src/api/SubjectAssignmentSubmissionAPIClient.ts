import { AssignmentSubmissionRow } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { ISubjectAssignmentSubmissionAPIClient } from "./ISubjectAssignmentSubmissionAPIClient";

/**
 * Provides operations for subject assignment submission API calls.
 */
export class SubjectAssignmentSubmissionAPIClient
    extends APIClient
    implements ISubjectAssignmentSubmissionAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/assignments";
    }

    getSubmissions(
        assignmentId: number,
        signal?: AbortSignal,
    ): Promise<AssignmentSubmissionRow[]> {
        return this.get(`/${assignmentId.toString()}/submissions`, {
            signal,
        }).then((res) => res.json());
    }
}
