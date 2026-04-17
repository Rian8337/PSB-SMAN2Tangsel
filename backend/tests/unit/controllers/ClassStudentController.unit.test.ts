import { ClassStudentController } from "@/controllers/ClassStudentController";
import { MessageKey } from "@/i18n";
import { UserListItem } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockClassStudentService,
} from "@test/mocks";

describe("ClassStudentController (unit)", () => {
    const controller = new ClassStudentController(mockClassStudentService);
    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getEnrolledStudents", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            UserListItem[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                query: { query: "Budi", limit: "15", offset: "30" },
            });
        });

        it("should parse valid parameters and return students", async () => {
            mockClassStudentService.getEnrolledStudents.mockResolvedValue([]);

            await controller.getEnrolledStudents(req, res);

            expect(
                mockClassStudentService.getEnrolledStudents,
            ).toHaveBeenCalledWith(1, "Budi", 15, 30);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-5" }])(
            "should return 400 for an invalid class ID: $id",
            async ({ id }) => {
                req.params.id = id;

                await controller.getEnrolledStudents(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassStudentService.getEnrolledStudents,
                ).not.toHaveBeenCalled();
            },
        );

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidLimitFormat"],
            ["0", "controller.invalidLimitRange"],
            ["-5", "controller.invalidLimitRange"],
            ["51", "controller.invalidLimitRange"],
        ])(
            "should return 400 for invalid limit: %s",
            async (limit, errorKey) => {
                req.query.limit = limit;

                await controller.getEnrolledStudents(req, res);

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

                await controller.getEnrolledStudents(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("getUnenrolledStudents", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            UserListItem[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                query: { query: "Siti", limit: "15", offset: "30" },
            });
        });

        it("should parse valid parameters and return students", async () => {
            mockClassStudentService.getUnenrolledStudents.mockResolvedValue([]);

            await controller.getUnenrolledStudents(req, res);

            expect(
                mockClassStudentService.getUnenrolledStudents,
            ).toHaveBeenCalledWith(1, "Siti", 15, 30);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-5" }])(
            "should return 400 for an invalid class ID: $id",
            async ({ id }) => {
                req.params.id = id;

                await controller.getUnenrolledStudents(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassStudentService.getUnenrolledStudents,
                ).not.toHaveBeenCalled();
            },
        );

        it.each<[string, MessageKey]>([
            ["abc", "controller.invalidLimitFormat"],
            ["0", "controller.invalidLimitRange"],
            ["-5", "controller.invalidLimitRange"],
            ["51", "controller.invalidLimitRange"],
        ])(
            "should return 400 for invalid limit: %s",
            async (limit, errorKey) => {
                req.query.limit = limit;

                await controller.getUnenrolledStudents(req, res);

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

                await controller.getUnenrolledStudents(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: errorKey });
            },
        );
    });

    describe("enrollStudent", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            never,
            { studentId: number }
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                body: { studentId: 101 },
            });
        });

        it("should call service and return 201 on success", async () => {
            await controller.enrollStudent(req, res);

            expect(mockClassStudentService.enrollStudent).toHaveBeenCalledWith(
                1,
                101,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it.each([{ id: "abc" as unknown as number }, { id: 0 }, { id: -5 }])(
            "should return 400 for an invalid class ID: $id",
            async ({ id }) => {
                req.params.id = id as unknown as string;

                await controller.enrollStudent(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassStudentService.enrollStudent,
                ).not.toHaveBeenCalled();
            },
        );

        it.each([
            { id: "abc" as unknown as number },
            { id: 0 },
            { id: -5 },
            { id: null as unknown as number }, // studentId cannot be null unlike teacherId!
        ])(
            "should return 400 for an invalid student ID: $id",
            async ({ id }) => {
                req.body.studentId = id;

                await controller.enrollStudent(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassStudentService.enrollStudent,
                ).not.toHaveBeenCalled();
            },
        );
    });

    describe("unenrollStudent", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string; studentId: string },
            never
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1", studentId: "101" },
            });
        });

        it("should call service and return 204 on success", async () => {
            await controller.unenrollStudent(req, res);

            expect(
                mockClassStudentService.unenrollStudent,
            ).toHaveBeenCalledWith(1, 101);

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-5" }])(
            "should return 400 for an invalid class ID: $id",
            async ({ id }) => {
                req.params.id = id;

                await controller.unenrollStudent(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassStudentService.unenrollStudent,
                ).not.toHaveBeenCalled();
            },
        );

        it.each([{ id: "abc" }, { id: "0" }, { id: "-5" }])(
            "should return 400 for an invalid student ID: $id",
            async ({ id }) => {
                req.params.studentId = id;

                await controller.unenrollStudent(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockClassStudentService.unenrollStudent,
                ).not.toHaveBeenCalled();
            },
        );
    });
});
