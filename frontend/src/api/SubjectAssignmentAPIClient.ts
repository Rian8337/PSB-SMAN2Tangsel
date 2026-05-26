import { StudentSubjectAssignment, TeacherSubjectAssignment } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { ISubjectAssignmentAPIClient } from "./ISubjectAssignmentAPIClient";

/**
 * Provides operations for subject assignment API calls.
 */
export class SubjectAssignmentAPIClient
    extends APIClient
    implements ISubjectAssignmentAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/assignments";
    }

    getAssignment(
        assignmentId: number,
        signal?: AbortSignal,
    ): Promise<StudentSubjectAssignment | TeacherSubjectAssignment> {
        return this.get(`/${assignmentId.toString()}`, { signal }).then((res) =>
            res.json(),
        );
    }
}
