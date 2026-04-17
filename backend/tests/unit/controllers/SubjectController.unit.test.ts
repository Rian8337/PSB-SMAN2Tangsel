import { SubjectController } from "@/controllers";
import { MessageKey } from "@/i18n";
import { Subject } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockSubjectService,
} from "@test/mocks";

describe("SubjectController (unit)", () => {
    const controller = new SubjectController(mockSubjectService);

    const mockSubject: Subject = {
        id: 1,
        active: true,
        code: "MA101",
        name: "Matematika",
    };

    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            Subject
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should return subject details for valid ID", async () => {
            mockSubjectService.findById.mockResolvedValueOnce(mockSubject);

            await controller.getSubject(req, res);

            expect(mockSubjectService.findById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockSubject);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid subject ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.getSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.findById).not.toHaveBeenCalled();
        });
    });

    describe("listSubjects", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            Subject[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should decode query and pass pagination parameters", async () => {
            req.query = {
                query: "matematika%20lanjutan",
                limit: "10",
                offset: "5",
            };

            mockSubjectService.listSubjects.mockResolvedValueOnce([
                mockSubject,
            ]);

            await controller.listSubjects(req, res);

            expect(mockSubjectService.listSubjects).toHaveBeenCalledWith(
                "matematika lanjutan",
                10,
                5,
            );

            expect(res.json).toHaveBeenCalledWith([mockSubject]);
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

                await controller.listSubjects(req, res);

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

                await controller.listSubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("createSubject", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            never,
            Partial<Subject>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should create subject with valid data", async () => {
            req.body = { code: "MA101", name: "Matematika" };

            await controller.createSubject(req, res);

            expect(mockSubjectService.createSubject).toHaveBeenCalledWith(
                "MA101",
                "Matematika",
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it("should return 400 if Zod validation fails", async () => {
            req.body = { code: "fis-xi", name: "Fisika" };

            await controller.createSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.createSubject).not.toHaveBeenCalled();
        });
    });

    describe("updateSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never,
            Partial<Subject>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should default active to true if not provided", async () => {
            req.body = { code: "MA101", name: "Matematika" };

            await controller.updateSubject(req, res);

            expect(mockSubjectService.updateSubject).toHaveBeenCalledWith(
                1,
                "MA101",
                "Matematika",
                true,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid subject ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.updateSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.updateSubject).not.toHaveBeenCalled();
        });
    });

    describe("deleteSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should delete subject with valid ID", async () => {
            await controller.deleteSubject(req, res);

            expect(mockSubjectService.deleteSubject).toHaveBeenCalledWith(1);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-2" },
        ])("should return 400 for invalid subject ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.deleteSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(mockSubjectService.deleteSubject).not.toHaveBeenCalled();
        });
    });
});
