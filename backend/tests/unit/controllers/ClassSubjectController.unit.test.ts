import { ClassSubjectController } from "@/controllers/ClassSubjectController";
import { MessageKey } from "@/i18n";
import { ClassSubjectAssignment, Subject } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassSubjectService,
} from "@test/mocks";

describe("ClassSubjectController (unit)", () => {
    const controller = new ClassSubjectController(mockClassSubjectService);
    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("listAssignedSubjects", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            ClassSubjectAssignment[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                query: { query: "Math", limit: "15", offset: "30" },
            });
        });

        it("should parse valid parameters and return subjects", async () => {
            mockClassSubjectService.listAssignedSubjects.mockResolvedValue([]);

            await controller.listAssignedSubjects(req, res);

            expect(
                mockClassSubjectService.listAssignedSubjects,
            ).toHaveBeenCalledWith(1, "Math", 15, 30);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-5" },
        ])("should return 400 for an invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.listAssignedSubjects(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(
                mockClassSubjectService.listAssignedSubjects,
            ).not.toHaveBeenCalled();
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

                await controller.listAssignedSubjects(req, res);

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

                await controller.listAssignedSubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("listUnassignedSubjects", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            Subject[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                query: { query: "Math", limit: "15", offset: "30" },
            });
        });

        it("should parse valid parameters and return subjects", async () => {
            mockClassSubjectService.listUnassignedSubjects.mockResolvedValue(
                [],
            );

            await controller.listUnassignedSubjects(req, res);

            expect(
                mockClassSubjectService.listUnassignedSubjects,
            ).toHaveBeenCalledWith(1, "Math", 15, 30);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-5" },
        ])("should return 400 for an invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.listUnassignedSubjects(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(
                mockClassSubjectService.listUnassignedSubjects,
            ).not.toHaveBeenCalled();
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

                await controller.listUnassignedSubjects(req, res);

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

                await controller.listUnassignedSubjects(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("assignSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never,
            Partial<{ subjectId: number; teacherId: number | null }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                body: { subjectId: 101, teacherId: 5 },
            });
        });

        it("should call service and return 201 on success", async () => {
            await controller.assignSubject(req, res);

            expect(mockClassSubjectService.assignSubject).toHaveBeenCalledWith(
                1,
                101,
                5,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it("should allow a null teacherId", async () => {
            req.body.teacherId = null;

            await controller.assignSubject(req, res);

            expect(mockClassSubjectService.assignSubject).toHaveBeenCalledWith(
                1,
                101,
                null,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it.each([
            // NaN
            { id: "abc" as unknown as number },
            // Zero ID
            { id: 0 },
            // Negative ID
            { id: -5 },
        ])(
            "should return 400 for an invalid subject ID: $id",
            async ({ id }) => {
                req.body.subjectId = id;

                await controller.assignSubject(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassSubjectService.assignSubject,
                ).not.toHaveBeenCalled();
            },
        );

        it.each([
            // NaN
            { id: "abc" as unknown as number },
            // Zero ID
            { id: 0 },
            // Negative ID
            { id: -5 },
        ])(
            "should return 400 for an invalid teacher ID: $id",
            async ({ id }) => {
                req.body.teacherId = id;

                await controller.assignSubject(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassSubjectService.assignSubject,
                ).not.toHaveBeenCalled();
            },
        );
    });

    describe("updateAssignedSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string; classSubjectId: string },
            never,
            Partial<{ teacherId: number | null }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1", classSubjectId: "2" },
                body: { teacherId: 5 },
            });
        });

        it("should call service and return 204 on success", async () => {
            await controller.updateAssignedSubject(req, res);

            expect(
                mockClassSubjectService.updateAssignedSubject,
            ).toHaveBeenCalledWith(1, 2, 5);

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-5" },
        ])("should return 400 for an invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.updateAssignedSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(
                mockClassSubjectService.updateAssignedSubject,
            ).not.toHaveBeenCalled();
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-5" },
        ])(
            "should return 400 for an invalid assignment ID: $id",
            async ({ id }) => {
                req.params.classSubjectId = id;

                await controller.updateAssignedSubject(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassSubjectService.updateAssignedSubject,
                ).not.toHaveBeenCalled();
            },
        );

        it.each([
            // NaN
            { id: "abc" as unknown as number },
            // Zero ID
            { id: 0 },
            // Negative ID
            { id: -5 },
        ])(
            "should return 400 for an invalid teacher ID: $id",
            async ({ id }) => {
                req.body.teacherId = id;

                await controller.updateAssignedSubject(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassSubjectService.updateAssignedSubject,
                ).not.toHaveBeenCalled();
            },
        );
    });

    describe("unassignSubject", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string; classSubjectId: string },
            never
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1", classSubjectId: "2" },
            });
        });

        it("should call service and return 204 on success", async () => {
            await controller.unassignSubject(req, res);

            expect(
                mockClassSubjectService.unassignSubject,
            ).toHaveBeenCalledWith(1, 2);

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-5" },
        ])("should return 400 for an invalid class ID: $id", async ({ id }) => {
            req.params.id = id;

            await controller.unassignSubject(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(
                mockClassSubjectService.unassignSubject,
            ).not.toHaveBeenCalled();
        });

        it.each([
            // NaN
            { id: "abc" },
            // Zero ID
            { id: "0" },
            // Negative ID
            { id: "-5" },
        ])(
            "should return 400 for an invalid assignment ID: $id",
            async ({ id }) => {
                req.params.classSubjectId = id;

                await controller.unassignSubject(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassSubjectService.unassignSubject,
                ).not.toHaveBeenCalled();
            },
        );
    });
});
