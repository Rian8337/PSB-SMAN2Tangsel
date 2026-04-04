import {
    AcademicSessionDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { ISessionAPIClient } from "./ISessionAPIClient";

/**
 * Provides operations for academic session-related API calls.
 */
export class SessionAPIClient extends APIClient implements ISessionAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/sessions";
    }

    getActive(): Promise<AcademicSessionDTO | null> {
        return this.get("/active").then((res) => {
            if (res.status === 404) {
                return null;
            }

            return res.json();
        });
    }

    getSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<AcademicSessionDTO | null> {
        const url = new URL(this.baseURL + "/");

        url.searchParams.append("session", encodeURIComponent(session));
        url.searchParams.append("semester", semester.toString());

        return this.get(url).then((res) => {
            if (res.status === 404) {
                return null;
            }

            return res.json();
        });
    }

    async createSession(
        session: ValidSession,
        semester: ValidSemester,
        startTime: number,
        endTime: number,
        active: boolean,
    ): Promise<void> {
        await this.post("/", {
            body: JSON.stringify({
                session,
                semester,
                startTime,
                endTime,
                active,
            }),
            headers: { "Content-Type": "application/json" },
        });
    }

    listSessions(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<AcademicSessionDTO[]> {
        const url = new URL(this.baseURL + "/list");

        if (typeof query === "string" && query.trim().length > 0) {
            url.searchParams.append("query", query.trim());
        }

        if (typeof limit === "number") {
            url.searchParams.append("limit", limit.toString());
        }

        if (typeof offset === "number") {
            url.searchParams.append("offset", offset.toString());
        }

        return this.get(url).then((res) => res.json());
    }

    async updateSession(
        session: ValidSession,
        semester: ValidSemester,
        startTime: number,
        endTime: number,
        active: boolean,
    ): Promise<void> {
        await this.put("/", {
            body: JSON.stringify({
                session,
                semester,
                startTime,
                endTime,
                active,
            }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async deleteSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void> {
        await this.delete("/", {
            body: JSON.stringify({ session, semester }),
            headers: { "Content-Type": "application/json" },
        });
    }
}
