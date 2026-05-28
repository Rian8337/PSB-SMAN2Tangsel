import { SubjectAssignmentSubmissionAPIClient } from "@/api";
import { AssignmentSubmissionRow } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("SubjectAssignmentSubmissionAPIClient (unit)", () => {
    const client = new SubjectAssignmentSubmissionAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockSubmissions: AssignmentSubmissionRow[] = [
        {
            studentId: 3,
            studentIdentifier: "0019217804",
            studentName: "Reza Mouna Hendrian",
            submittedAt: "2026-02-18T12:57:32.000Z",
        },
    ];

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockSubmissions),
            blob: () => Promise.resolve(new Blob(["zip"])),
            headers: new Headers(),
        } as Response);
    });

    describe("getSubmissions", () => {
        it("should send a GET request to the correct endpoint and return submissions", async () => {
            const result = await client.getSubmissions(5);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/assignments/5/submissions");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockSubmissions);
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.getSubmissions(10, controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("downloadSubmissions", () => {
        it("should send a GET request to the correct endpoint without studentId", async () => {
            await client.downloadSubmissions(5);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/assignments/5/submissions/download");
            expect(urlStr).not.toContain("studentId");
            expect(options?.method).toBe("GET");
        });

        it("should include studentId as a query param when provided", async () => {
            await client.downloadSubmissions(5, 3);

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain(
                "/assignments/5/submissions/download?studentId=3",
            );
        });

        it("should return the blob and extract filename from Content-Disposition header", async () => {
            const mockBlob = new Blob(["zip content"]);

            fetchSpy.mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
                headers: new Headers({
                    "Content-Disposition":
                        'attachment; filename="submissions-5.zip"',
                }),
            } as Response);

            const result = await client.downloadSubmissions(5);

            expect(result.blob).toBe(mockBlob);
            expect(result.filename).toBe("submissions-5.zip");
        });

        it("should return undefined filename when Content-Disposition header is absent", async () => {
            fetchSpy.mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(new Blob()),
                headers: new Headers(),
            } as Response);

            const result = await client.downloadSubmissions(5);

            expect(result.filename).toBeUndefined();
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.downloadSubmissions(5, undefined, controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });
});
