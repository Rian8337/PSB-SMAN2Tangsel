import { ScheduleAPIClient } from "@/api";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("ScheduleAPIClient (unit)", () => {
    const client = new ScheduleAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getSchedule", () => {
        it("should send a GET request and return the schedule array", async () => {
            const controller = new AbortController();

            const mockScheduleData: ScheduleDTO[] = [
                {
                    id: 1,
                    classSubjectId: 1,
                    day: ScheduleDay.monday,
                    startTime: 0,
                    endTime: 100,
                    subject: { code: "T1", name: "Test" },
                },
            ];

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockScheduleData),
            } as Response);

            const result = await client.getSchedule(controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain("/schedule/");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual(mockScheduleData);
        });
    });

    describe("download", () => {
        it("should return a Blob and extract the filename from Content-Disposition if present", async () => {
            const controller = new AbortController();
            const mockBlob = new Blob(["dummy content"], {
                type: "application/pdf",
            });

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers({
                    "Content-Disposition":
                        'attachment; filename="schedule_2025.pdf";',
                }),
            } as unknown as Response);

            const result = await client.download(controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/schedule/download",
            );

            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result.blob).toBe(mockBlob);
            expect(result.filename).toBe("schedule_2025.pdf");
        });

        it("should return the Blob but leave filename undefined if Content-Disposition is missing", async () => {
            const mockBlob = new Blob(["dummy content"]);

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers(),
            } as unknown as Response);

            const result = await client.download();

            expect(result.blob).toBe(mockBlob);
            expect(result.filename).toBeUndefined();
        });

        it("should return the Blob but leave filename undefined if Content-Disposition lacks a filename", async () => {
            const mockBlob = new Blob(["dummy content"]);

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers({
                    "Content-Disposition": "inline",
                }),
            } as unknown as Response);

            const result = await client.download();

            expect(result.blob).toBe(mockBlob);
            expect(result.filename).toBeUndefined();
        });

        it("should correctly handle filenames without quotes in Content-Disposition", async () => {
            const mockBlob = new Blob(["dummy content"]);

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers({
                    "Content-Disposition":
                        "attachment; filename=raw_schedule.csv",
                }),
            } as unknown as Response);

            const result = await client.download();

            expect(result.filename).toBe("raw_schedule.csv");
        });
    });
});
