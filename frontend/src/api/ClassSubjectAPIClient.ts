import { ClassSubjectAssignment, Subject } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IClassSubjectAPIClient } from "./IClassSubjectAPIClient";

/**
 * Provides operations for API calls related to subject management of classes.
 */
export class ClassSubjectAPIClient
    extends APIClient
    implements IClassSubjectAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/classes";
    }

    listAssignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<ClassSubjectAssignment[]> {
        const url = new URL(this.baseURL + `/${classId.toString()}/subjects`);

        if (typeof query === "string" && query.trim().length > 0) {
            url.searchParams.append("query", query.trim());
        }

        if (limit !== undefined) {
            url.searchParams.append("limit", limit.toString());
        }

        if (offset !== undefined) {
            url.searchParams.append("offset", offset.toString());
        }

        return this.get(url, { signal }).then((res) => res.json());
    }

    listUnassignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<Subject[]> {
        const url = new URL(
            this.baseURL + `/${classId.toString()}/subjects/unassigned`,
        );

        if (typeof query === "string" && query.trim().length > 0) {
            url.searchParams.append("query", query.trim());
        }

        if (limit !== undefined) {
            url.searchParams.append("limit", limit.toString());
        }

        if (offset !== undefined) {
            url.searchParams.append("offset", offset.toString());
        }

        return this.get(url, { signal }).then((res) => res.json());
    }

    async assignSubject(
        classId: number,
        subjectId: number,
        teacherId: number | null,
    ) {
        await this.post(`/${classId.toString()}/subjects`, {
            body: JSON.stringify({ subjectId, teacherId }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async updateAssignedSubject(
        classId: number,
        assignmentId: number,
        teacherId: number | null,
    ) {
        await this.patch(
            `/${classId.toString()}/subjects/${assignmentId.toString()}`,
            {
                body: JSON.stringify({ teacherId }),
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    async unassignSubject(classId: number, assignmentId: number) {
        await this.delete(
            `/${classId.toString()}/subjects/${assignmentId.toString()}`,
        );
    }
}
