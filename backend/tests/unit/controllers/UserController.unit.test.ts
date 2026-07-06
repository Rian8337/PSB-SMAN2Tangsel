import { UserController } from "@/controllers";
import { User, UserListItem, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassSubjectService,
    mockUserService,
} from "@test/mocks";

describe("UserController (unit)", () => {
    const controller = new UserController(
        mockUserService,
        mockClassSubjectService,
    );

    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getUser", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            UserListItem
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.Administrator,
                    identifier: "1",
                },
                params: { id: "2" },
            });
        });

        it("should return user details for valid ID", async () => {
            const mockUser: User = {
                active: true,
                id: 2,
                password: "testpassword",
                identifier: "1234567890",
                name: "John Doe",
                role: UserRole.Student,
            };

            mockUserService.findById.mockResolvedValue(mockUser);

            await controller.getUser(req, res);

            expect(mockUserService.findById).toHaveBeenCalledWith(2);

            expect(res.json).toHaveBeenCalledWith({
                id: mockUser.id,
                active: mockUser.active,
                name: mockUser.name,
                role: mockUser.role,
                identifier: mockUser.identifier,
            });
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid user ID: %s", async ({ id }) => {
            req.params.id = id;

            await controller.getUser(req, res);

            expect(mockUserService.findById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("listUsers", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            UserListItem[],
            unknown,
            Partial<{
                query?: string;
                limit?: string;
                offset?: string;
                role: string;
            }>
        >();

        const mockUsers: UserListItem[] = [];
        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.Administrator,
                    identifier: "1",
                },
            });

            mockUserService.listUsers.mockResolvedValue(mockUsers);
        });

        it("should return a list of users with default pagination", async () => {
            await controller.listUsers(req, res);

            expect(mockUserService.listUsers).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
                undefined,
            );

            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });

        it("should parse and pass valid role, query, limit, and offset queries to service", async () => {
            req.query.role = UserRole.Student.toString();
            req.query.query = "test";
            req.query.limit = "10";
            req.query.offset = "20";

            await controller.listUsers(req, res);

            expect(mockUserService.listUsers).toHaveBeenCalledWith(
                UserRole.Student,
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
            never,
            Partial<{
                name: string;
                password: string;
                role: UserRole;
                identifier: string;
            }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.Administrator,
                    identifier: "1",
                },
                body: {
                    name: "John Doe",
                    password: "Password123!",
                    role: UserRole.Student,
                    identifier: "1234567890",
                },
            });
        });

        it("should return 201 on successful user creation", async () => {
            mockUserService.create.mockResolvedValue(undefined);

            await controller.createUser(req, res);

            expect(mockUserService.create).toHaveBeenCalledWith(
                "John Doe",
                "Password123!",
                UserRole.Student,
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

    describe("updateUser", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never,
            Partial<{ name: string; active: boolean }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.Administrator,
                    identifier: "1",
                },
                params: { id: "2" },
                body: {
                    name: "Jane Doe",
                    active: false,
                },
            });
        });

        it("should return 200 on successful state update", async () => {
            mockUserService.update.mockResolvedValue(undefined);

            await controller.updateUser(req, res);

            expect(mockUserService.update).toHaveBeenCalledWith(
                2,
                "Jane Doe",
                false,
                1,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it("should return 401 if requested without a session", async () => {
            req.sessionData = undefined;

            await controller.updateUser(req, res);

            expect(mockUserService.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it.each([
            // Wrong userId type
            { id: "-2" },
            // Negative userId
            { id: "-1" },
            // Zero userId
            { id: "0" },
            // NaN userId
            { id: "NaN" },
        ])("should return 400 for invalid user ID: %o", async ({ id }) => {
            req.params.id = id;

            await controller.updateUser(req, res);

            expect(mockUserService.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it.each([
            // Invalid name type
            { name: 123 },
            // Missing name
            { name: undefined },
        ])("should return 400 for invalid name: %o", async ({ name }) => {
            req.body.name = name as unknown as string;

            await controller.updateUser(req, res);

            expect(mockUserService.update).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it.each([
            // Invalid active type
            { active: "true" },
            { active: null },
        ])(
            "should return 400 for invalid active state: %o",
            async ({ active }) => {
                req.body.active = active as unknown as boolean;

                await controller.updateUser(req, res);

                expect(mockUserService.update).not.toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(400);
            },
        );
    });

    describe("updatePassword", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            never,
            Partial<{ currentPassword: string; newPassword: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.Administrator,
                    identifier: "1",
                },
                body: {
                    currentPassword: "OldPassword123!",
                    newPassword: "NewPassword123!",
                },
            });
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
            never
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.Administrator,
                    identifier: "1",
                },
                params: {
                    id: "2",
                },
            });
        });

        it("should return 204 on successful user deletion", async () => {
            mockUserService.delete.mockResolvedValue(undefined);

            await controller.deleteUser(req, res);

            expect(mockUserService.delete).toHaveBeenCalledWith(2, 1);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it("should return 401 if requested without a session", async () => {
            req.sessionData = undefined;

            await controller.deleteUser(req, res);

            expect(mockUserService.delete).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
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
