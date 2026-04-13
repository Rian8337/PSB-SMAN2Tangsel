import { ClassController } from "@/controllers";
import { MessageKey } from "@/i18n";
import { Class } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassService,
} from "@test/mocks";

describe("ClassController (unit)", () => {
    const controller = new ClassController(mockClassService);

    const mockClass: Class = {
        id: 1,
        name: "X IPA 1",
        session: "2023/2024",
        semester: 1,
    };

    describe("getById", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            Class | { error: string }
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
            res = createMockResponse();
        });

        it("should return class data when the class exists", async () => {
            mockClassService.getClassById.mockResolvedValue(mockClass);

            await controller.getById(req, res);

            expect(mockClassService.getClassById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockClass);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.getById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("list", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            Class[] | { error: string },
            unknown,
            Partial<{
                session: string;
                semester: string;
                query: string;
                limit: string;
                offset: string;
            }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "IPA",
                },
            });

            res = createMockResponse();
        });

        it("should list classes based on query parameters", async () => {
            const mockClasses = [mockClass];

            mockClassService.listClasses.mockResolvedValue(mockClasses);

            await controller.list(req, res);

            expect(mockClassService.listClasses).toHaveBeenCalledWith({
                session: "2023/2024",
                semester: 1,
                query: "IPA",
            });

            expect(res.json).toHaveBeenCalledWith(mockClasses);
        });

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidLimitFormat"],
            ["0", "controller.invalidLimitRange"],
            ["-5", "controller.invalidLimitRange"],
            ["51", "controller.invalidLimitRange"],
        ])(
            "should return 400 for invalid limit: %s",
            async (limit, errorKey) => {
                req.query.limit = limit;

                await controller.list(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidOffsetFormat"],
            ["-1", "controller.invalidOffsetRange"],
        ])(
            "should return 400 for invalid offset: %s",
            async (offset, errorKey) => {
                req.query.offset = offset;

                await controller.list(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("create", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<Class>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                body: { name: "X IPA 1", session: "2023/2024", semester: 1 },
            });

            res = createMockResponse();
        });

        it("should create a new class with valid data", async () => {
            await controller.create(req, res);

            expect(mockClassService.createClass).toHaveBeenCalledWith(
                "X IPA 1",
                "2023/2024",
                1,
            );
        });

        it("should return 400 if Zod validation fails", async () => {
            req.body = {
                name: "X IPA 1",
                session: "2023/2025", // Invalid session format
                semester: 2,
            };

            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockClassService.createClass).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            { error: string },
            { name: string }
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                body: { name: "X IPA 2" },
            });

            res = createMockResponse();
        });

        it("should update class name with valid data", async () => {
            await controller.update(req, res);

            expect(mockClassService.updateClass).toHaveBeenCalledWith(
                1,
                "X IPA 2",
            );
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.update(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockClassService.updateClass).not.toHaveBeenCalled();
        });

        it.each([{ name: "" }, { name: "A".repeat(51) }])(
            "should return 400 for invalid class name: $name",
            async ({ name }) => {
                req.body.name = name;

                await controller.update(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(mockClassService.updateClass).not.toHaveBeenCalled();
            },
        );
    });

    describe("delete", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            { error: string }
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
            res = createMockResponse();
        });

        it("should delete class with valid ID", async () => {
            await controller.delete(req, res);

            expect(mockClassService.deleteClass).toHaveBeenCalledWith(1);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.delete(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockClassService.deleteClass).not.toHaveBeenCalled();
        });
    });
});
