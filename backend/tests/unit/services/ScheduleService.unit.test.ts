import { BadRequestError, ConflictError, NotFoundError } from "@/types";
import {
    CreateScheduleOptions,
    ScheduleService,
    UpdateScheduleOptions,
} from "@/services";
import { ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { mockScheduleRepository } from "@test/mocks";

describe("ScheduleService (unit)", () => {
    const service = new ScheduleService(mockScheduleRepository);

    describe("getClassSchedule", () => {
        it("should delegate to ScheduleRepository.findByClassId", async () => {
            const schedules: ScheduleDTO[] = [];

            mockScheduleRepository.findByClassId.mockResolvedValueOnce(
                schedules,
            );

            const result = await service.getClassSchedule(1);

            expect(mockScheduleRepository.findByClassId).toHaveBeenCalledWith(
                1,
            );
            expect(result).toBe(schedules);
        });
    });

    describe("getTeacherSchedule", () => {
        it("should delegate to ScheduleRepository.findByTeacherId", async () => {
            const schedules: ScheduleDTO[] = [];

            mockScheduleRepository.findByTeacherId.mockResolvedValueOnce(
                schedules,
            );

            const result = await service.getTeacherSchedule(1);

            expect(mockScheduleRepository.findByTeacherId).toHaveBeenCalledWith(
                1,
            );
            expect(result).toBe(schedules);
        });
    });

    describe("generateIcsFile", () => {
        // A Monday
        const sessionStart = new Date("2025-01-06T00:00:00Z");
        const sessionEnd = new Date("2025-06-20T00:00:00Z");

        it("should return an empty calendar buffer if there are no schedules", () => {
            const buffer = service.generateIcsFile(
                [],
                sessionStart,
                sessionEnd,
            );

            const content = buffer.toString("utf-8");

            expect(content).toContain("BEGIN:VCALENDAR");
            expect(content).toContain("END:VCALENDAR");
            expect(content).not.toContain("BEGIN:VEVENT");
        });

        it("should generate a valid ICS file for the given schedules", () => {
            const schedules: ScheduleDTO[] = [
                {
                    id: 1,
                    classSubjectId: 1,
                    day: ScheduleDay.Monday,
                    startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                    endTime: new Date("1970-01-01T09:30:00Z").getTime(),
                    subject: { code: "MA1", name: "Matematika Wajib " },
                },
            ];

            const buffer = service.generateIcsFile(
                schedules,
                sessionStart,
                sessionEnd,
            );

            const content = buffer.toString("utf-8");

            expect(content).toContain("BEGIN:VEVENT");
            expect(content).toContain("SUMMARY:(MA1) Matematika Wajib");
            expect(content).toContain(
                "RRULE:FREQ=WEEKLY;UNTIL=20250620T000000Z",
            );
        });
    });

    describe("create", () => {
        const options: CreateScheduleOptions = {
            classSubjectId: 1,
            day: ScheduleDay.Monday,
            startTime: new Date("1970-01-01T08:00:00Z"),
            endTime: new Date("1970-01-01T09:30:00Z"),
        };

        it("should throw BadRequestError if startTime is after or equal to endTime", async () => {
            await expect(
                service.create({
                    ...options,
                    startTime: new Date("1970-01-01T10:00:00Z"),
                }),
            ).rejects.toThrow(
                new BadRequestError("scheduleService.invalidTimeOrder"),
            );

            expect(mockScheduleRepository.hasConflict).not.toHaveBeenCalled();
        });

        it("should throw ConflictError if repository detects a double-booking", async () => {
            mockScheduleRepository.hasConflict.mockResolvedValueOnce(true);

            await expect(service.create(options)).rejects.toThrow(
                new ConflictError("scheduleService.scheduleConflict"),
            );

            expect(mockScheduleRepository.create).not.toHaveBeenCalled();
        });

        it("should successfully create a schedule if no conflicts exist", async () => {
            mockScheduleRepository.hasConflict.mockResolvedValueOnce(false);

            await service.create(options);

            expect(mockScheduleRepository.create).toHaveBeenCalledWith(
                options.classSubjectId,
                options.day,
                options.startTime,
                options.endTime,
            );
        });
    });

    describe("update", () => {
        const options: UpdateScheduleOptions = {
            id: 99,
            day: ScheduleDay.Tuesday,
            startTime: new Date("1970-01-01T10:00:00Z"),
            endTime: new Date("1970-01-01T11:30:00Z"),
        };

        it("should throw BadRequestError if startTime is after or equal to endTime", async () => {
            await expect(
                service.update({
                    ...options,
                    startTime: new Date("1970-01-01T12:00:00Z"),
                }),
            ).rejects.toThrow(
                new BadRequestError("scheduleService.invalidTimeOrder"),
            );
        });

        it("should throw NotFoundError if the schedule being updated does not exist", async () => {
            mockScheduleRepository.findById.mockResolvedValueOnce(null);

            await expect(service.update(options)).rejects.toThrow(
                new NotFoundError("scheduleService.scheduleNotFound"),
            );
        });

        it("should throw ConflictError if updating creates a double-booking", async () => {
            mockScheduleRepository.findById.mockResolvedValueOnce({
                id: 99,
                classSubjectId: 5,
                day: ScheduleDay.Monday,
                startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                endTime: new Date("1970-01-01T09:30:00Z").getTime(),
                subject: {
                    code: "MA1",
                    name: "Matematika Wajib ",
                },
            });

            mockScheduleRepository.hasConflict.mockResolvedValueOnce(true);

            await expect(service.update(options)).rejects.toThrow(
                new ConflictError("scheduleService.scheduleConflict"),
            );
        });

        it("should exclude its own ID when checking for conflicts and successfully update", async () => {
            mockScheduleRepository.findById.mockResolvedValueOnce({
                id: 99,
                classSubjectId: 5,
                day: ScheduleDay.Monday,
                startTime: new Date("1970-01-01T08:00:00Z").getTime(),
                endTime: new Date("1970-01-01T09:30:00Z").getTime(),
                subject: {
                    code: "MA1",
                    name: "Matematika Wajib ",
                },
            });

            mockScheduleRepository.hasConflict.mockResolvedValueOnce(false);

            await service.update(options);

            expect(mockScheduleRepository.hasConflict).toHaveBeenCalledWith(
                5,
                options.day,
                options.startTime,
                options.endTime,
                options.id,
            );

            expect(mockScheduleRepository.update).toHaveBeenCalledWith(
                options.id,
                options.day,
                options.startTime,
                options.endTime,
            );
        });
    });

    describe("delete", () => {
        it("should call the repository delete method", async () => {
            await service.delete(1);

            expect(mockScheduleRepository.delete).toHaveBeenCalledWith(1);
        });
    });
});
