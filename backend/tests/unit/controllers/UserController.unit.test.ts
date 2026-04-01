import { UserController } from "@/controllers";
import { UserListItem, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockUserService,
} from "@test/mocks";

describe("UserController (unit)", () => {
    const controller = new UserController(mockUserService);

    describe("listUsers", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            UserListItem[] | { error: string },
            unknown,
            Partial<{ query?: string; limit?: string; offset?: string }>
        >();

        const mockUsers: UserListItem[] = [];
        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.administrator,
                    identifier: "1",
                },
            });

            res = createMockResponse();

            mockUserService.listUsers.mockResolvedValue(mockUsers);
        });

        it("should return a list of users with default pagination", async () => {
            await controller.listUsers(req, res);

            expect(mockUserService.listUsers).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
            );

            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });

        it("should parse and pass valid query, limit, and offset queries to service", async () => {
            req.query.query = "test";
            req.query.limit = "10";
            req.query.offset = "20";

            await controller.listUsers(req, res);

            expect(mockUserService.listUsers).toHaveBeenCalledWith(
                "test",
                10,
                20,
            );
        });

        it.each(["abc", Number.NaN])(
            "should return 400 for invalid limit: %s",
            async (limit) => {
                req.query.limit = limit.toString();

                await controller.listUsers(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    error: "controller.invalidLimitFormat",
                });
            },
        );

        it.each([-1, 0, 51])(
            "should return 400 for out-of-range limit: %d",
            async (limit) => {
                req.query.limit = limit.toString();

                await controller.listUsers(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    error: "controller.invalidLimitRange",
                });
            },
        );

        it.each(["abc", Number.NaN])(
            "should return 400 for invalid offset: %s",
            async (offset) => {
                req.query.offset = offset.toString();

                await controller.listUsers(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    error: "controller.invalidOffsetFormat",
                });
            },
        );

        it("should return 400 for negative offset", async () => {
            req.query.offset = "-1";

            await controller.listUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "controller.invalidOffsetRange",
            });
        });
    });

    describe("createUser", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<{
                name: string;
                password: string;
                role: UserRole;
                identifier: string;
            }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.administrator,
                    identifier: "1",
                },
                body: {
                    name: "John Doe",
                    password: "Password123!",
                    role: UserRole.student,
                    identifier: "1234567890",
                },
            });

            res = createMockResponse();
        });

        it("should return 201 on successful user creation", async () => {
            mockUserService.create.mockResolvedValue(undefined);

            await controller.createUser(req, res);

            expect(mockUserService.create).toHaveBeenCalledWith(
                "John Doe",
                "Password123!",
                UserRole.student,
                "1234567890",
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it.each([
            // Invalid name type
            { name: 123 },
            // Missing name
            { name: undefined },
            // Invalid password type
            { password: null },
            // Wrong role type
            { role: "student" },
            // Wrong identifier type
            { identifier: 1234567890 },
        ])("should return 400 for invalid body: %o", async (invalidBody) => {
            req.body = { ...req.body, ...invalidBody } as typeof req.body;

            await controller.createUser(req, res);

            expect(mockUserService.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("updateActiveState", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<{ userId: number; active: boolean }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.administrator,
                    identifier: "1",
                },
                body: {
                    userId: 2,
                    active: false,
                },
            });

            res = createMockResponse();
        });

        it("should return 200 on successful state update", async () => {
            mockUserService.updateActiveState.mockResolvedValue(undefined);

            await controller.updateActiveState(req, res);

            expect(mockUserService.updateActiveState).toHaveBeenCalledWith(
                2,
                false,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it.each([
            // Wrong userId type
            { userId: "-2" },
            // Negative userId
            { userId: -1 },
            // Zero userId
            { userId: 0 },
            // NaN userId
            { userId: Number.NaN },
            // Wrong active type
            { active: "false" },
            // Wrong active type
            { active: null },
        ])("should return 400 for invalid body: %o", async (invalidBody) => {
            req.body = { ...req.body, ...invalidBody } as typeof req.body;

            await controller.updateActiveState(req, res);

            expect(mockUserService.updateActiveState).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("updatePassword", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<{ currentPassword: string; newPassword: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.administrator,
                    identifier: "1",
                },
                body: {
                    currentPassword: "OldPassword123!",
                    newPassword: "NewPassword123!",
                },
            });

            res = createMockResponse();
        });

        it("should return 200 on successful password update", async () => {
            mockUserService.updatePassword.mockResolvedValue(undefined);

            await controller.updatePassword(req, res);

            expect(mockUserService.updatePassword).toHaveBeenCalledWith(
                1,
                "OldPassword123!",
                "NewPassword123!",
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it.each([
            { currentPassword: 123 },
            { currentPassword: undefined },
            { newPassword: ["array"] },
            { newPassword: null },
        ])("should return 400 for invalid body: %o", async (invalidBody) => {
            req.body = { ...req.body, ...invalidBody } as typeof req.body;

            await controller.updatePassword(req, res);

            expect(mockUserService.updatePassword).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("deleteUser", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            { error: string }
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.administrator,
                    identifier: "1",
                },
                params: {
                    id: "2",
                },
            });

            res = createMockResponse();
        });

        it("should return 204 on successful user deletion", async () => {
            mockUserService.delete.mockResolvedValue(undefined);

            await controller.deleteUser(req, res);

            expect(mockUserService.delete).toHaveBeenCalledWith(2);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])(
            "should return 400 for invalid params: %o",
            async (invalidParams) => {
                req.params = invalidParams;

                await controller.deleteUser(req, res);

                expect(mockUserService.delete).not.toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(400);
            },
        );
    });
});
