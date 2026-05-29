import { SubjectMaterialAPIClient } from "@/api";
import { SubjectMaterial } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("SubjectMaterialAPIClient (unit)", () => {
    const client = new SubjectMaterialAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockMaterial: SubjectMaterial = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        title: "Chapter 1",
        description: "Introduction",
        visible: true,
        createdAt: "2024-01-15T00:00:00.000Z",
        lastUpdatedAt: "2024-01-23T00:00:00.000Z",
        attachments: [{ id: 1, name: "buku.pdf" }],
    };

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockMaterial),
        } as Response);
    });

    describe("getMaterial", () => {
        it("should send a GET request to the correct endpoint and return the material", async () => {
            const result = await client.getMaterial(5);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/materials/5");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockMaterial);
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.getMaterial(10, controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("createMaterial", () => {
        it("should send a POST request to /materials and return the created material", async () => {
            const formData = new FormData();
            formData.append("title", "New Material");

            const result = await client.createMaterial(formData);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/materials");
            expect(urlStr).not.toMatch(/\/materials\/\d/);
            expect(options?.method).toBe("POST");
            expect(options?.body).toBe(formData);

            expect(result).toEqual(mockMaterial);
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.createMaterial(new FormData(), controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("updateMaterial", () => {
        beforeEach(() => {
            fetchSpy.mockResolvedValue({ ok: true } as Response);
        });

        it("should send a PUT request to /materials/:id", async () => {
            const formData = new FormData();
            formData.append("title", "Updated");

            await client.updateMaterial(7, formData);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/materials/7");
            expect(options?.method).toBe("PUT");
            expect(options?.body).toBe(formData);
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.updateMaterial(7, new FormData(), controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("deleteMaterial", () => {
        beforeEach(() => {
            fetchSpy.mockResolvedValue({ ok: true } as Response);
        });

        it("should send a DELETE request to /materials/:id", async () => {
            await client.deleteMaterial(3);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/materials/3");
            expect(options?.method).toBe("DELETE");
        });

        it("should pass the AbortSignal when provided", async () => {
            const controller = new AbortController();

            await client.deleteMaterial(3, controller.signal);

            const [, options] = fetchSpy.mock.calls[0];
            expect(options?.signal).toBe(controller.signal);
        });
    });
});
