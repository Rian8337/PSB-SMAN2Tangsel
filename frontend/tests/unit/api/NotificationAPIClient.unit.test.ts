import { NotificationAPIClient } from "@/api";
import { MockInstance, vi } from "vitest";

describe("NotificationAPIClient (unit)", () => {
    const client = new NotificationAPIClient();
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

    describe("getNotifications", () => {
        it("should construct the URL with default limit and offset if not provided", async () => {
            await client.getNotifications();

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/notifications/");
            expect(urlStr).toContain("limit=5");
            expect(urlStr).toContain("offset=0");
            expect(options?.signal).toBeUndefined();
        });

        it("should append custom limit, offset, and pass the AbortSignal", async () => {
            const controller = new AbortController();

            await client.getNotifications(15, 30, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/notifications/");
            expect(urlStr).toContain("limit=15");
            expect(urlStr).toContain("offset=30");
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("getUnreadCount", () => {
        it("should send a GET request and extract the count integer from the response body", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ count: 42 }),
            } as Response);

            const result = await client.getUnreadCount(controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/notifications/unread-count",
            );

            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);
            expect(result).toBe(42);
        });
    });

    describe("updateReadStatus", () => {
        it("should send a PATCH request with the boolean read status payload", async () => {
            await client.updateReadStatus(101, true);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/notifications/101/read-status",
            );

            expect(options?.method).toBe("PATCH");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(JSON.stringify({ read: true }));
        });
    });
});
