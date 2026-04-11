import { ClassAPIClient } from "@/api";
import { Class } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("ClassAPIClient (unit)", () => {
    const client = new ClassAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockClass: Class = {
        id: 1,
        name: "X MIPA 1",
        session: "2024/2025",
        semester: 1,
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

    describe("getClass", () => {
        it("should send a GET request for a specific class ID", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockClass),
            } as Response);

            const result = await client.getClass(1, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain("/classes/1");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual(mockClass);
        });
    });

    describe("listClasses", () => {
        it("should construct the URL without query parameters if no options are provided", async () => {
            await client.listClasses();

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/list");
            expect(urlStr).not.toContain("?");
            expect(options?.signal).toBeUndefined();
        });

        it("should append all provided query parameters and pass the AbortSignal", async () => {
            const controller = new AbortController();

            await client.listClasses({
                session: "2024/2025",
                semester: 2,
                query: "MIPA",
                limit: 15,
                offset: 30,
                signal: controller.signal,
            });

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/list");
            expect(urlStr).toContain("session=2024%2F2025");
            expect(urlStr).toContain("semester=2");
            expect(urlStr).toContain("query=MIPA");
            expect(urlStr).toContain("limit=15");
            expect(urlStr).toContain("offset=30");

            expect(options?.signal).toBe(controller.signal);
        });

        it("should trim the query parameter and ignore empty strings", async () => {
            await client.listClasses({ query: "   " });

            expect(fetchSpy).toHaveBeenCalledOnce();
            const [url] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).not.toContain("query=");
        });
    });

    describe("createClass", () => {
        it("should send a POST request with the new class payload", async () => {
            await client.createClass("X IPS 2", "2025/2026", 1);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toMatch(/\/classes\/?$/);
            expect(options?.method).toBe("POST");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    name: "X IPS 2",
                    session: "2025/2026",
                    semester: 1,
                }),
            );
        });
    });

    describe("updateClass", () => {
        it("should send a PATCH request with the updated class name", async () => {
            await client.updateClass(42, "X MIPA 3");

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain("/classes/42");
            expect(options?.method).toBe("PATCH");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(JSON.stringify({ name: "X MIPA 3" }));
        });
    });

    describe("deleteClass", () => {
        it("should send a DELETE request for a specific class ID", async () => {
            await client.deleteClass(42);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain("/classes/42");
            expect(options?.method).toBe("DELETE");
            expect(options?.body).toBeUndefined();
        });
    });
});
