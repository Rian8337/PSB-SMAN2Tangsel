import { ClassSubjectAssignment, Subject } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { ISubjectAPIClient } from "./ISubjectAPIClient";

/**
 * Provides operations for subject-related API calls.
 */
export class SubjectAPIClient extends APIClient implements ISubjectAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/subjects";
    }

    getSubject(id: number, signal?: AbortSignal): Promise<Subject> {
        return this.get(`/${id.toString()}`, { signal }).then((res) =>
            res.json(),
        );
    }

    getMySubjects(
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<ClassSubjectAssignment[]> {
        const url = new URL(this.baseURL + "/me");

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

    listSubjects(
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<Subject[]> {
        const url = new URL(this.baseURL + "/list");

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

    async createSubject(code: string, name: string): Promise<void> {
        await this.post("/", {
            body: JSON.stringify({ code, name }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async updateSubject(
        id: number,
        code: string,
        name: string,
        active: boolean,
    ): Promise<void> {
        await this.put(`/${id.toString()}`, {
            body: JSON.stringify({ code, name, active }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async deleteSubject(id: number): Promise<void> {
        await this.delete(`/${id.toString()}`);
    }
}
