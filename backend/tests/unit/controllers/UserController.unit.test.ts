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
            Partial<{ limit?: string; offset?: string }>
        >();

        const mockUsers: UserListItem[] = [];
        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                sessionData: {
                    userId: 1,
                    role: UserRole.administrator,
                    staffId: 1,
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
            );

            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });

        it("should parse and pass valid limit and offset queries to service", async () => {
            req.query.limit = "10";
            req.query.offset = "20";

            await controller.listUsers(req, res);

            expect(mockUserService.listUsers).toHaveBeenCalledWith(10, 20);
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
});
