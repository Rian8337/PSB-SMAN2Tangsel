import { SubjectAPIClient } from "@/api";
import { Subject } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("SubjectAPIClient (unit)", () => {
    const client = new SubjectAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockSubject: Subject = {
        id: 101,
        code: "MATH",
        name: "Mathematics",
        active: true,
    };

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        } as Response);
    });

    describe("getSubject", () => {
        it("should send a GET request for a specific subject ID", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSubject),
            } as Response);

            const result = await client.getSubject(101, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/subjects/101");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual(mockSubject);
        });
    });

    describe("listSubjects", () => {
        it("should construct the URL without query parameters if none are provided", async () => {
            await client.listSubjects();

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/subjects/list");
            expect(urlStr).not.toContain("?");
            expect(options?.signal).toBeUndefined();
        });

        it("should append all provided query parameters and pass the AbortSignal", async () => {
            const controller = new AbortController();

            await client.listSubjects(" Science ", 15, 30, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/subjects/list");
            // Also check for trimmed space.
            expect(urlStr).toContain("query=Science");
            expect(urlStr).toContain("limit=15");
            expect(urlStr).toContain("offset=30");

            expect(options?.signal).toBe(controller.signal);
        });

        it("should ignore an empty or whitespace-only query parameter", async () => {
            await client.listSubjects("   ", 10, 0);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).not.toContain("query=");
            expect(urlStr).toContain("limit=10");
        });
    });

    describe("createSubject", () => {
        it("should send a POST request with the new subject payload", async () => {
            await client.createSubject("PHYS", "Physics");

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toMatch(/\/subjects\/?$/);
            expect(options?.method).toBe("POST");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({ code: "PHYS", name: "Physics" }),
            );
        });
    });

    describe("updateSubject", () => {
        it("should send a PUT request with the fully updated subject payload", async () => {
            await client.updateSubject(
                101,
                "ADV-MATH",
                "Advanced Mathematics",
                false,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/subjects/101");
            expect(options?.method).toBe("PUT");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    code: "ADV-MATH",
                    name: "Advanced Mathematics",
                    active: false,
                }),
            );
        });
    });

    describe("deleteSubject", () => {
        it("should send a DELETE request for a specific subject ID", async () => {
            await client.deleteSubject(101);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/subjects/101");
            expect(options?.method).toBe("DELETE");
            expect(options?.body).toBeUndefined();
        });
    });
});
