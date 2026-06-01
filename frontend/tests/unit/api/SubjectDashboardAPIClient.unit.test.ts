import { SubjectDashboardAPIClient } from "@/api";
import { SubjectDashboard } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("SubjectDashboardAPIClient (unit)", () => {
    const client = new SubjectDashboardAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockDashboard: SubjectDashboard = {
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        class: { id: 1, name: "X-IPA-1", session: "2024/2025", semester: 1 },
        materials: [
            { id: 1, title: "Material 1", description: null, visible: true },
        ],
        assignments: [{ id: 1, title: "Assignment 1", visible: true }],
    };

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockDashboard),
        } as Response);
    });

    describe("getDashboard", () => {
        it("should send a GET request to the correct endpoint and return the dashboard", async () => {
            const result = await client.getDashboard(5);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/class-subjects/5/dashboard");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockDashboard);
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.getDashboard(10, controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });
});
