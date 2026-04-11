import { Class, ValidSemester, ValidSession } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IClassAPIClient, ListClassOptions } from "./IClassAPIClient";

/**
 * Provides operations for class-related API calls.
 */
export class ClassAPIClient extends APIClient implements IClassAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/classes";
    }

    getClass(id: number, signal?: AbortSignal): Promise<Class> {
        return this.get(`/${id.toString()}`, { signal }).then((res) =>
            res.json(),
        );
    }

    listClasses(options?: ListClassOptions): Promise<Class[]> {
        const url = new URL(this.baseURL + "/list");

        if (options) {
            const { session, semester, query, limit, offset } = options;

            if (session) {
                url.searchParams.append("session", session);
            }

            if (semester) {
                url.searchParams.append("semester", semester.toString());
            }

            if (typeof query === "string" && query.trim().length > 0) {
                url.searchParams.append("query", query.trim());
            }

            if (limit !== undefined) {
                url.searchParams.append("limit", limit.toString());
            }

            if (offset !== undefined) {
                url.searchParams.append("offset", offset.toString());
            }
        }

        return this.get(url, { signal: options?.signal }).then((res) =>
            res.json(),
        );
    }

    async createClass(
        name: string,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void> {
        await this.post("/", {
            body: JSON.stringify({ name, session, semester }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async updateClass(id: number, name: string): Promise<void> {
        await this.patch(`/${id.toString()}`, {
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async deleteClass(id: number): Promise<void> {
        await this.delete(`/${id.toString()}`);
    }
}
