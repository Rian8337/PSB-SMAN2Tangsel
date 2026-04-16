import { ClassSubjectAPIClient } from "@/api";
import { MockInstance, vi } from "vitest";

describe("ClassSubjectAPIClient (unit)", () => {
    const client = new ClassSubjectAPIClient();
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

    describe("listAssignedSubjects", () => {
        it("should construct the correct URL with all query parameters", async () => {
            const controller = new AbortController();

            await client.listAssignedSubjects(
                10,
                "Math",
                5,
                20,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/subjects");
            expect(urlStr).toContain("query=Math");
            expect(urlStr).toContain("limit=5");
            expect(urlStr).toContain("offset=20");

            expect(options?.signal).toBe(controller.signal);
        });

        it("should omit optional query parameters when not provided", async () => {
            await client.listAssignedSubjects(10);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/subjects");
            expect(urlStr).not.toContain("query=");
            expect(urlStr).not.toContain("limit=");
            expect(urlStr).not.toContain("offset=");
        });
    });

    describe("listUnassignedSubjects", () => {
        it("should construct the correct URL with query parameters", async () => {
            await client.listUnassignedSubjects(10, "Phys", 10, 0);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/subjects/unassigned");
            expect(urlStr).toContain("query=Phys");
            expect(urlStr).toContain("limit=10");
            expect(urlStr).toContain("offset=0");
        });
    });

    describe("assignSubject", () => {
        it("should send a POST request with the correct JSON payload", async () => {
            await client.assignSubject(10, 101, 5);

            expect(fetchSpy).toHaveBeenCalledOnce();
            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/classes/10/subjects",
            );

            expect(options?.method).toBe("POST");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({ subjectId: 101, teacherId: 5 }),
            );
        });

        it("should allow a null teacherId", async () => {
            await client.assignSubject(10, 101, null);

            expect(fetchSpy).toHaveBeenCalledOnce();
            const [, options] = fetchSpy.mock.calls[0];

            expect(options?.body).toBe(
                JSON.stringify({ subjectId: 101, teacherId: null }),
            );
        });
    });

    describe("updateAssignedSubject", () => {
        it("should send a PATCH request with the updated teacherId", async () => {
            await client.updateAssignedSubject(10, 42, 99);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL).toString()).toContain(
                "/classes/10/subjects/42",
            );

            expect(options?.method).toBe("PATCH");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(JSON.stringify({ teacherId: 99 }));
        });
    });

    describe("unassignSubject", () => {
        it("should send a DELETE request targeting the assignment ID", async () => {
            await client.unassignSubject(10, 42);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/classes/10/subjects/42",
            );

            expect(options?.method).toBe("DELETE");
            expect(options?.body).toBeUndefined();
        });
    });
});
