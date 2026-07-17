import { AnalyticsAPIClient } from "@/api";
import { DownloadAnalytics, SubmissionAnalytics } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("AnalyticsAPIClient (unit)", () => {
    const client = new AnalyticsAPIClient();
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

    describe("getDownloadAnalytics", () => {
        const mockDownloadAnalytics: DownloadAnalytics = {
            timeSeries: [{ weekStart: "2024-01-01", count: 3 }],
            topAttachments: [],
        };

        it("should send a GET request with the session, semester, and default limit", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockDownloadAnalytics),
            } as Response);

            const result = await client.getDownloadAnalytics(
                "2024/2025",
                1,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/analytics/downloads");
            expect(urlStr).toContain("session=2024%2F2025");
            expect(urlStr).toContain("semester=1");
            expect(urlStr).toContain("limit=5");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockDownloadAnalytics);
        });

        it("should use the provided limit and pass the AbortSignal", async () => {
            const controller = new AbortController();

            await client.getDownloadAnalytics(
                "2024/2025",
                2,
                10,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("semester=2");
            expect(urlStr).toContain("limit=10");
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("getSubmissionAnalytics", () => {
        const mockSubmissionAnalytics: SubmissionAnalytics = {
            summary: { onTime: 1, late: 2, missing: 3, pending: 4 },
            concerningStudents: [],
        };

        it("should send a GET request with the session, semester, and default limit", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSubmissionAnalytics),
            } as Response);

            const result = await client.getSubmissionAnalytics(
                "2024/2025",
                1,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/analytics/submissions");
            expect(urlStr).toContain("session=2024%2F2025");
            expect(urlStr).toContain("semester=1");
            expect(urlStr).toContain("limit=5");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockSubmissionAnalytics);
        });

        it("should use the provided limit and pass the AbortSignal", async () => {
            const controller = new AbortController();

            await client.getSubmissionAnalytics(
                "2024/2025",
                2,
                10,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("semester=2");
            expect(urlStr).toContain("limit=10");
            expect(options?.signal).toBe(controller.signal);
        });
    });
});
