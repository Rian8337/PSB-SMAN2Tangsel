import { ScheduleController } from "@/controllers";
import { ScheduleDTO, UserRole } from "@psb/shared/types";
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

    describe("getMySchedule", () => {
        let req: ReturnType<
            ReturnType<
                typeof createMockRequestFactory<
                    "/",
                    { error: string } | ScheduleDTO[]
                >
            >
        >;

        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequestFactory<
                "/",
                { error: string } | ScheduleDTO[]
            >()();

            res = createMockResponse();
        });

        it("should return 403 if no session is present", async () => {
            await controller.getMySchedule(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("should return class schedule if user is a student", async () => {
            mockScheduleService.getClassSchedule.mockResolvedValue([]);

            req.sessionData = {
                classId: 1,
                nisn: "1234567890",
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
                staffId: 1,
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
        let req: ReturnType<
            ReturnType<
                typeof createMockRequestFactory<
                    "/download",
                    { error: string } | Buffer
                >
            >
        >;

        let res: ReturnType<typeof createMockResponse>;

        beforeEach(() => {
            req = createMockRequestFactory<
                "/download",
                { error: string } | Buffer
            >()();

            res = createMockResponse();
        });

        it("should return 403 if no session is present", async () => {
            await controller.downloadSchedule(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("should attach correct headers and send buffer", async () => {
            req.sessionData = {
                classId: 1,
                nisn: "1234567890",
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
});
