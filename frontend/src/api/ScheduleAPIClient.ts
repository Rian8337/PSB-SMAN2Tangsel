import { ScheduleDTO, ValidSemester, ValidSession } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import {
    CreateScheduleOptions,
    IScheduleAPIClient,
    UpdateScheduleOptions,
} from "./IScheduleAPIClient";

/**
 * Provides operations for schedule-related API calls.
 */
export class ScheduleAPIClient extends APIClient implements IScheduleAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/schedule";
    }

    getById(id: number, signal?: AbortSignal): Promise<ScheduleDTO> {
        return this.get(`/${id.toString()}`, { signal }).then((res) =>
            res.json(),
        );
    }

    getSchedule(
        session?: ValidSession,
        semester?: ValidSemester,
        signal?: AbortSignal,
    ): Promise<ScheduleDTO[]> {
        const url = new URL(this.baseURL + "/");

        if (session !== undefined) {
            url.searchParams.append("session", session);
        }

        if (semester !== undefined) {
            url.searchParams.append("semester", semester.toString());
        }

        return this.get(url, { signal }).then((res) => res.json());
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

    async createSchedule(options: CreateScheduleOptions) {
        await this.post("/", {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        });
    }

    async updateSchedule(options: UpdateScheduleOptions) {
        const { id, ...data } = options;

        await this.put(`/${id.toString()}`, {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
    }

    async deleteSchedule(id: number) {
        await this.delete(`/${id.toString()}`);
    }
}
