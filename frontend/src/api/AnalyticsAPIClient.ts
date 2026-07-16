import {
    DownloadAnalytics,
    SubmissionAnalytics,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IAnalyticsAPIClient } from "./IAnalyticsAPIClient";

/**
 * Provides operations for download analytics-related API calls.
 */
export class AnalyticsAPIClient
    extends APIClient
    implements IAnalyticsAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/analytics";
    }

    getDownloadAnalytics(
        session: ValidSession,
        semester: ValidSemester,
        limit = 5,
        signal?: AbortSignal,
    ): Promise<DownloadAnalytics> {
        const url = new URL(this.baseURL + "/downloads");

        url.searchParams.append("session", session);
        url.searchParams.append("semester", semester.toString());
        url.searchParams.append("limit", limit.toString());

        return this.get(url, { signal }).then((res) => res.json());
    }

    getSubmissionAnalytics(
        session: ValidSession,
        semester: ValidSemester,
        limit = 5,
        signal?: AbortSignal,
    ): Promise<SubmissionAnalytics> {
        const url = new URL(this.baseURL + "/submissions");

        url.searchParams.append("session", session);
        url.searchParams.append("semester", semester.toString());
        url.searchParams.append("limit", limit.toString());

        return this.get(url, { signal }).then((res) => res.json());
    }
}
