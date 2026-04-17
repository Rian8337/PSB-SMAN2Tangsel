import { ClassStudentAPIClient } from "@/api";
import { MockInstance, vi } from "vitest";

describe("ClassStudentAPIClient (unit)", () => {
    const client = new ClassStudentAPIClient();
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

    describe("getEnrolledStudents", () => {
        it("should construct the correct URL with all query parameters", async () => {
            const controller = new AbortController();

            await client.getEnrolledStudents(
                10,
                "John Doe",
                5,
                20,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/students");
            expect(urlStr).toContain("query=John+Doe");
            expect(urlStr).toContain("limit=5");
            expect(urlStr).toContain("offset=20");

            expect(options?.signal).toBe(controller.signal);
        });

        it("should omit optional query parameters when not provided", async () => {
            await client.getEnrolledStudents(10);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/students");
            expect(urlStr).not.toContain("query=");
            expect(urlStr).not.toContain("limit=");
            expect(urlStr).not.toContain("offset=");
        });
    });

    describe("getUnenrolledStudents", () => {
        it("should construct the correct URL with query parameters", async () => {
            await client.getUnenrolledStudents(10, "Phys", 10, 0);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/students/unenrolled");
            expect(urlStr).toContain("query=Phys");
            expect(urlStr).toContain("limit=10");
            expect(urlStr).toContain("offset=0");
        });

        it("should omit optional query parameters when not provided", async () => {
            await client.getUnenrolledStudents(10);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/classes/10/students/unenrolled");
            expect(urlStr).not.toContain("query=");
            expect(urlStr).not.toContain("limit=");
            expect(urlStr).not.toContain("offset=");
        });
    });

    describe("enrollStudent", () => {
        it("should send a POST request with the correct JSON payload", async () => {
            await client.enrollStudent(10, 101);

            expect(fetchSpy).toHaveBeenCalledOnce();
            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain(
                "/classes/10/students",
            );

            expect(options?.method).toBe("POST");

            expect(options?.headers).toMatchObject(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(JSON.stringify({ studentId: 101 }));
        });
    });

    describe("unenrollStudent", () => {
        it("should send a DELETE request targeting the student ID", async () => {
            await client.unenrollStudent(10, 42);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL).toString()).toContain(
                "/classes/10/students/42",
            );

            expect(options?.method).toBe("DELETE");
            expect(options?.body).toBeUndefined();
        });
    });
});
