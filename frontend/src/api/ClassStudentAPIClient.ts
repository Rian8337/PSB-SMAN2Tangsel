import { UserListItem } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IClassStudentAPIClient } from "./IClassStudentAPIClient";

/**
 * Provides operations for API calls related to student enrollment in classes.
 */
export class ClassStudentAPIClient
    extends APIClient
    implements IClassStudentAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/classes";
    }

    getEnrolledStudents(
        classId: number,
        signal?: AbortSignal,
    ): Promise<UserListItem[]> {
        const url = new URL(this.baseURL + `/${classId.toString()}/students`);

        return this.get(url, { signal }).then((res) => res.json());
    }

    getUnenrolledStudents(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<UserListItem[]> {
        const url = new URL(
            this.baseURL + `/${classId.toString()}/students/unenrolled`,
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

    async enrollStudent(classId: number, studentId: number): Promise<void> {
        await this.post(`/${classId.toString()}/students`, {
            body: JSON.stringify({ studentId }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async unenrollStudent(classId: number, studentId: number): Promise<void> {
        await this.delete(
            `/${classId.toString()}/students/${studentId.toString()}`,
        );
    }
}
