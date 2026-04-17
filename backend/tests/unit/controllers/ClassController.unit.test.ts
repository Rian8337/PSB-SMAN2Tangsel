import { ClassController } from "@/controllers";
import { MessageKey } from "@/i18n";
import { Class, ScheduleDTO } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassService,
    mockScheduleService,
} from "@test/mocks";

describe("ClassController (unit)", () => {
    const controller = new ClassController(
        mockClassService,
        mockScheduleService,
    );

    const mockClass: Class = {
        id: 1,
        name: "X IPA 1",
        session: "2023/2024",
        semester: 1,
    };

    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getById", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            Class
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
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

    describe("getClassSchedule", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            ScheduleDTO[]
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should return class schedule when the class exists", async () => {
            const mockSchedule: ScheduleDTO[] = [];

            mockScheduleService.getClassSchedule.mockResolvedValue(
                mockSchedule,
            );

            await controller.getClassSchedule(req, res);

            expect(mockScheduleService.getClassSchedule).toHaveBeenCalledWith(
                1,
            );

            expect(res.json).toHaveBeenCalledWith(mockSchedule);
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

            await controller.getClassSchedule(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("list", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            Class[],
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

        beforeEach(() => {
            req = createMockRequest({
                query: {
                    session: "2023/2024",
                    semester: "1",
                    query: "IPA",
                },
            });
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
            never,
            Partial<Class>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                body: { name: "X IPA 1", session: "2023/2024", semester: 1 },
            });
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
            never,
            { name: string }
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                body: { name: "X IPA 2" },
            });
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
            never
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
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
