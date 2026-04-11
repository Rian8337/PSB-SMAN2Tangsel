import { SessionAPIClient } from "@/api";
import { AcademicSessionDTO } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("SessionAPIClient (unit)", () => {
    const client = new SessionAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockSession: AcademicSessionDTO = {
        session: "2024/2025",
        semester: 1,
        startTime: 1704067200,
        endTime: 1719792000,
        active: true,
    };

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getActive", () => {
        it("should send a GET request to the active endpoint", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSession),
            } as Response);

            const result = await client.getActive(controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/sessions/active",
            );

            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual(mockSession);
        });
    });

    describe("getSession", () => {
        it("should send a GET request with session and semester query parameters", async () => {
            const controller = new AbortController();

            await client.getSession("2024/2025", 2, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL).toString();

            expect(urlStr).toContain("/sessions/");
            expect(urlStr).toContain("session=2024%2F2025");
            expect(urlStr).toContain("semester=2");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("createSession", () => {
        it("should send a POST request with the new session payload", async () => {
            await client.createSession(
                "2025/2026",
                1,
                1704067200,
                1719792000,
                true,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toMatch(/\/sessions\/?$/);
            expect(options?.method).toBe("POST");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    session: "2025/2026",
                    semester: 1,
                    startTime: 1704067200,
                    endTime: 1719792000,
                    active: true,
                }),
            );
        });
    });

    describe("listSessions", () => {
        it("should construct the URL without query parameters if omitted", async () => {
            await client.listSessions();

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL).toString();

            expect(urlStr).toContain("/sessions/list");
            expect(urlStr).not.toContain("?");
            expect(options?.signal).toBeUndefined();
        });

        it("should append limit, offset, and search query parameters safely", async () => {
            const controller = new AbortController();

            await client.listSessions(" 2024 ", 20, 40, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL).toString();

            expect(urlStr).toContain("/sessions/list");
            expect(urlStr).toContain("query=2024");
            expect(urlStr).toContain("limit=20");
            expect(urlStr).toContain("offset=40");
            expect(options?.signal).toBe(controller.signal);
        });

        it("should ignore an empty string query parameter", async () => {
            await client.listSessions("   ", 10, 0);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL).toString();

            expect(urlStr).toContain("limit=10");
            expect(urlStr).not.toContain("query=");
        });
    });

    describe("updateSession", () => {
        it("should send a PUT request with the updated session payload", async () => {
            await client.updateSession(
                "2024/2025",
                2,
                1704067200,
                1719792000,
                false,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toMatch(/\/sessions\/?$/);
            expect(options?.method).toBe("PUT");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    session: "2024/2025",
                    semester: 2,
                    startTime: 1704067200,
                    endTime: 1719792000,
                    active: false,
                }),
            );
        });
    });

    describe("deleteSession", () => {
        it("should send a DELETE request with a JSON body identifying the session", async () => {
            await client.deleteSession("2024/2025", 1);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toMatch(/\/sessions\/?$/);
            expect(options?.method).toBe("DELETE");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({ session: "2024/2025", semester: 1 }),
            );
        });
    });
});
