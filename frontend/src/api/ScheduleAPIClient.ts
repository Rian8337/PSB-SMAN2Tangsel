import { ScheduleDTO } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IScheduleAPIClient } from "./IScheduleAPIClient";

/**
 * Provides operations for schedule-related API calls.
 */
export class ScheduleAPIClient extends APIClient implements IScheduleAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/schedule";
    }

    getSchedule(signal?: AbortSignal): Promise<ScheduleDTO[]> {
        return this.get("/", { signal }).then((res) => res.json());
    }

    async download(
        signal?: AbortSignal,
    ): Promise<Readonly<{ blob: Blob; filename?: string }>> {
        const res = await this.get("/download", { signal });
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
}
