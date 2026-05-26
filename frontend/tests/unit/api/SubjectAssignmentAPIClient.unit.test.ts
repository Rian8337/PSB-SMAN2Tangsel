import { SubjectAssignmentAPIClient } from "@/api";
import { StudentSubjectAssignment } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("SubjectAssignmentAPIClient (unit)", () => {
    const client = new SubjectAssignmentAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockAssignment: StudentSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        title: "Assignment 1",
        description: "Submit a report",
        dueAt: "2026-02-21T18:00:00.000Z",
        createdAt: "2024-01-15T00:00:00.000Z",
        lastUpdatedAt: "2024-01-23T00:00:00.000Z",
        attachments: [{ id: 1, name: "instructions.pdf" }],
        submission: null,
    };

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockAssignment),
        } as Response);
    });

    describe("getAssignment", () => {
        it("should send a GET request to the correct endpoint and return the assignment", async () => {
            const result = await client.getAssignment(5);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/assignments/5");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockAssignment);
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.getAssignment(10, controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });
});
