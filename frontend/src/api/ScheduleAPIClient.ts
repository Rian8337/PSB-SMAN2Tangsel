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

    getSchedule(): Promise<ScheduleDTO[]> {
        return this.get("/").then((res) => res.json());
    }

    download(): Promise<Blob> {
        return this.get("/download").then((res) => res.blob());
    }
}
