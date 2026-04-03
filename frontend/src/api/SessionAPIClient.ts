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
