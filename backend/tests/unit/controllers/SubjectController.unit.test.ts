import { SubjectController } from "@/controllers";
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

    describe("getSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            Subject | { error: string }
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
            res = createMockResponse();
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
            Subject[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
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
    });

    describe("createSubject", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string },
            Partial<Subject>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest();
            res = createMockResponse();
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
            { error: string },
            Partial<Subject>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
            res = createMockResponse();
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
    });

    describe("deleteSubject", () => {
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

        it("should delete subject with valid ID", async () => {
            await controller.deleteSubject(req, res);

            expect(mockSubjectService.deleteSubject).toHaveBeenCalledWith(1);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });
});
