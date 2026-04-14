import { ScheduleController } from "@/controllers";
import { ScheduleDay, ScheduleDTO, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockScheduleService,
    mockSessionService,
} from "@test/mocks";

describe("ScheduleController (unit)", () => {
    const controller = new ScheduleController(
        mockScheduleService,
        mockSessionService,
    );

    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getById", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            ScheduleDTO | { error: string }
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({ params: { id: "1" } });
        });

        it("should return schedule data on success", async () => {
            const schedule: ScheduleDTO = {
                id: 1,
                classSubjectId: 1,
                day: ScheduleDay.monday,
                startTime: new Date("2024-01-01T08:00:00Z").getTime(),
                endTime: new Date("2024-01-01T09:30:00Z").getTime(),
                subject: {
                    code: "MA1",
                    name: "Matematika Wajib",
                },
            };

            mockScheduleService.getById.mockResolvedValueOnce(schedule);

            await controller.getById(req, res);

            expect(mockScheduleService.getById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(schedule);
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-2" }])(
            "should return 400 for invalid ID: $id",
            async ({ id }) => {
                req.params.id = id;

                await controller.getById(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );
    });

    describe("getMySchedule", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string } | ScheduleDTO[]
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should return class schedule if user is a student", async () => {
            mockScheduleService.getClassSchedule.mockResolvedValue([]);

            req.sessionData = {
                classId: 1,
                identifier: "1234567890",
                role: UserRole.student,
                userId: 1,
            };

            await controller.getMySchedule(req, res);

            expect(mockScheduleService.getClassSchedule).toHaveBeenCalledWith(
                1,
            );

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("should return teacher schedule if user is a teacher", async () => {
            mockScheduleService.getTeacherSchedule.mockResolvedValue([]);

            req.sessionData = {
                role: UserRole.teacher,
                identifier: "1",
                userId: 1,
            };

            await controller.getMySchedule(req, res);

            expect(mockScheduleService.getTeacherSchedule).toHaveBeenCalledWith(
                1,
            );

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe("downloadSchedule", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string } | Buffer
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should attach correct headers and send buffer", async () => {
            req.sessionData = {
                classId: 1,
                identifier: "1234567890",
                role: UserRole.student,
                userId: 1,
            };

            req.t.mockReturnValue("jadwal");

            const mockBuffer = Buffer.from("mock ics file");

            mockSessionService.getActive.mockResolvedValue({
                active: true,
                endTime: new Date("2025-06-20T00:00:00Z"),
                semester: 2,
                session: "2024/2025",
                startTime: new Date("2025-01-06T00:00:00Z"),
            });

            mockScheduleService.getClassSchedule.mockResolvedValue([]);
            mockScheduleService.generateIcsFile.mockReturnValue(mockBuffer);

            await controller.downloadSchedule(req, res);

            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Disposition",
                'attachment; filename="jadwal-2024-2025-2.ics"',
            );

            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Type",
                "text/calendar; charset=utf-8",
            );

            expect(res.send).toHaveBeenCalledWith(mockBuffer);
        });
    });

    describe("create", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string } | { success: boolean },
            Partial<{
                classSubjectId: number;
                day: ScheduleDay;
                startTime: number;
                endTime: number;
            }>
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest({
                body: {
                    classSubjectId: 1,
                    day: ScheduleDay.monday,
                    startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                    endTime: new Date("1970-01-01T09:30:00Z").getTime(),
                },
            });
        });

        it("should call service and return 201 on success", async () => {
            await controller.create(req, res);

            expect(mockScheduleService.create).toHaveBeenCalledWith({
                classSubjectId: 1,
                day: ScheduleDay.monday,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                startTime: expect.any(Date),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                endTime: expect.any(Date),
            });

            expect(res.sendStatus).toHaveBeenCalledWith(201);
        });

        it.each([
            { classSubjectId: "abc" },
            { classSubjectId: -1 },
            { classSubjectId: 0 },
        ])(
            "should return 400 for invalid classSubjectId: $classSubjectId",
            async ({ classSubjectId }) => {
                req.body.classSubjectId = classSubjectId as unknown as number;

                await controller.create(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );

        it.each([{ day: "abc" }, { day: -1 }, { day: 7 }])(
            "should return 400 for invalid day: $day",
            async ({ day }) => {
                req.body.day = day as unknown as ScheduleDay;

                await controller.create(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );

        it("should return 400 for invalid startTime", async () => {
            req.body.startTime = "invalid" as unknown as number;

            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 for invalid endTime", async () => {
            req.body.endTime = "invalid" as unknown as number;

            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("update", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            { error: string },
            Partial<{
                day: ScheduleDay;
                startTime: number;
                endTime: number;
            }>
        >();

        let req: ReturnType<typeof createMockRequest>;
        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequest({
                params: { id: "1" },
                body: {
                    day: ScheduleDay.monday,
                    startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                    endTime: new Date("1970-01-01T09:30:00Z").getTime(),
                },
            });

            res = createMockResponse();
        });

        it("should call service and return 200 on success", async () => {
            await controller.update(req, res);

            expect(mockScheduleService.update).toHaveBeenCalledWith({
                id: 1,
                day: ScheduleDay.monday,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                startTime: expect.any(Date),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                endTime: expect.any(Date),
            });

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-1" }])(
            "should return 400 for invalid ID: $id",
            async ({ id }) => {
                req.params.id = id;

                await controller.update(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );

        it.each([{ day: "abc" }, { day: -1 }, { day: 7 }])(
            "should return 400 for invalid day: $day",
            async ({ day }) => {
                req.body.day = day as unknown as ScheduleDay;

                await controller.update(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );

        it("should return 400 for invalid startTime", async () => {
            req.body.startTime = "invalid" as unknown as number;

            await controller.update(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 for invalid endTime", async () => {
            req.body.endTime = "invalid" as unknown as number;

            await controller.update(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
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

        it("should call service and return 204 on success", async () => {
            await controller.delete(req, res);

            expect(mockScheduleService.delete).toHaveBeenCalledWith(1);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-1" }])(
            "should return 400 for invalid ID: $id",
            async ({ id }) => {
                req.params.id = id;

                await controller.delete(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );
    });
});
