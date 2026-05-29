import { AssignmentSubmissionRow, SubjectAssignmentSubmission } from "@psb/shared/types";
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

    async downloadSubmissions(
        assignmentId: number,
        studentId?: number,
        signal?: AbortSignal,
    ): Promise<Readonly<{ blob: Blob; filename?: string }>> {
        const params =
            studentId !== undefined ? `?studentId=${studentId.toString()}` : "";

        const res = await this.get(
            `/${assignmentId.toString()}/submissions/download${params}`,
            { signal },
        );

        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition");

        let filename: string | undefined;

        if (disposition?.includes("filename=")) {
            filename = disposition
                .split("filename=")[1]
                .split(";")[0]
                .trim()
                .replace(/"/g, "");
        }

        return { blob, filename };
    }

    createSubmission(
        assignmentId: number,
        data: FormData,
        signal?: AbortSignal,
    ): Promise<SubjectAssignmentSubmission> {
        return this.post(`/${assignmentId.toString()}/submissions`, {
            body: data,
            signal,
        }).then((res) => res.json());
    }

    async updateSubmission(
        assignmentId: number,
        data: FormData,
        signal?: AbortSignal,
    ): Promise<void> {
        await this.put(`/${assignmentId.toString()}/submissions`, {
            body: data,
            signal,
        });
    }

    async deleteSubmission(
        assignmentId: number,
        signal?: AbortSignal,
    ): Promise<void> {
        await this.delete(`/${assignmentId.toString()}/submissions`, { signal });
    }
}
