import { ScheduleService } from "@/services";
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
                    day: ScheduleDay.monday,
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
});
