import { UserAPIClient } from "@/api";
import { UserListItem, UserRole } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("UserAPIClient (unit)", () => {
    const client = new UserAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    const mockUser: UserListItem = {
        id: 1,
        name: "John Doe",
        identifier: "1",
        role: UserRole.Teacher,
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

    describe("getUser", () => {
        it("should send a GET request for a specific user ID", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUser),
            } as Response);

            const result = await client.getUser(1, controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/1");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual(mockUser);
        });
    });

    describe("listUsers", () => {
        it("should construct the URL without query parameters if omitted", async () => {
            await client.listUsers();

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/list");
            expect(urlStr).not.toContain("?");
            expect(options?.signal).toBeUndefined();
        });

        it("should append all provided query parameters safely", async () => {
            const controller = new AbortController();

            await client.listUsers(
                undefined,
                "  John  ",
                10,
                20,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/list");
            // Verify that it also trims.
            expect(urlStr).toContain("query=John");
            expect(urlStr).toContain("limit=10");
            expect(urlStr).toContain("offset=20");
            expect(options?.signal).toBe(controller.signal);
        });

        it("should append the role parameter when provided", async () => {
            await client.listUsers(UserRole.Student);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/list");
            expect(urlStr).toContain(`role=${UserRole.Student.toString()}`);
        });
    });

    describe("createUser", () => {
        it("should send a POST request to /create with the new user payload", async () => {
            await client.createUser(
                "Jane Doe",
                "securePass",
                UserRole.Student,
                "jane123",
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/create");
            expect(options?.method).toBe("POST");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    name: "Jane Doe",
                    password: "securePass",
                    role: UserRole.Student,
                    identifier: "jane123",
                }),
            );
        });
    });

    describe("updateUser", () => {
        it("should send a PATCH request with the updated user data", async () => {
            await client.updateUser(42, "Jane Smith", "1234567890", false);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/42");
            expect(options?.method).toBe("PATCH");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    name: "Jane Smith",
                    identifier: "1234567890",
                    active: false,
                }),
            );
        });
    });

    describe("updatePassword", () => {
        it("should send a PATCH request to /update-password", async () => {
            await client.updatePassword("oldPass123", "newPass456");

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/update-password");
            expect(options?.method).toBe("PATCH");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    currentPassword: "oldPass123",
                    newPassword: "newPass456",
                }),
            );
        });
    });

    describe("deleteUser", () => {
        it("should send a DELETE request for a specific user ID", async () => {
            await client.deleteUser(42);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/users/42");
            expect(options?.method).toBe("DELETE");
            expect(options?.body).toBeUndefined();
        });
    });
});
