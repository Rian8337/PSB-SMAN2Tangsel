import { SessionService } from "@/services";
import { BadRequestError, ConflictError, NotFoundError } from "@/types";
import { AcademicSession } from "@psb/shared/types";
import { mockSessionRepository } from "@test/mocks";

describe("SessionService (unit)", () => {
    const service = new SessionService(mockSessionRepository);

    const mockAcademicSession: AcademicSession = {
        session: "2024/2025",
        semester: 1,
        startTime: new Date("2024-08-01T00:00:00"),
        endTime: new Date("2024-12-15T00:00:00"),
        active: true,
    };

    describe("getActive", () => {
        it("should return the active session if one exists", async () => {
            mockSessionRepository.getActive.mockResolvedValue(
                mockAcademicSession,
            );

            const result = await service.getActive();

            expect(result).toEqual(mockAcademicSession);
            expect(mockSessionRepository.getActive).toHaveBeenCalledOnce();
        });

        it("should throw if no active session exists", async () => {
            mockSessionRepository.getActive.mockResolvedValue(null);

            await expect(service.getActive()).rejects.toThrow(
                new NotFoundError("sessionService.noActiveSession"),
            );
        });
    });

    describe("getSession", () => {
        it("should return the session if it exists", async () => {
            mockSessionRepository.get.mockResolvedValue(mockAcademicSession);

            const result = await service.getSession(
                mockAcademicSession.session,
                mockAcademicSession.semester,
            );

            expect(result).toEqual(mockAcademicSession);

            expect(mockSessionRepository.get).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
            );
        });

        it("should throw if the session does not exist", async () => {
            mockSessionRepository.get.mockResolvedValue(null);

            await expect(
                service.getSession(
                    mockAcademicSession.session,
                    mockAcademicSession.semester,
                ),
            ).rejects.toThrow(
                new NotFoundError("sessionService.sessionNotFound"),
            );
        });
    });

    describe("listSessions", () => {
        it("should pass parameters correctly to the repository", async () => {
            const mockList = [mockAcademicSession];
            mockSessionRepository.list.mockResolvedValue(mockList);

            const result = await service.listSessions("2024/2025", 10, 5);

            expect(result).toEqual(mockList);

            expect(mockSessionRepository.list).toHaveBeenCalledWith(
                "2024/2025",
                10,
                5,
            );
        });
    });

    describe("createSession", () => {
        it("should successfully create a session", async () => {
            mockSessionRepository.get.mockResolvedValue(null);
            mockSessionRepository.create.mockResolvedValue(undefined);

            await service.createSession(
                mockAcademicSession.session,
                mockAcademicSession.semester,
                mockAcademicSession.startTime,
                mockAcademicSession.endTime,
                mockAcademicSession.active ?? false,
            );

            expect(mockSessionRepository.get).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
            );

            expect(mockSessionRepository.create).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
                mockAcademicSession.startTime,
                mockAcademicSession.endTime,
                mockAcademicSession.active ?? false,
            );
        });

        it("should throw if start time is after or equal to end time", async () => {
            await expect(
                service.createSession(
                    mockAcademicSession.session,
                    mockAcademicSession.semester,
                    new Date("2024-12-15T00:00:00"),
                    new Date("2024-08-01T00:00:00"),
                    false,
                ),
            ).rejects.toThrow(
                new BadRequestError("sessionService.invalidSessionTime"),
            );

            expect(mockSessionRepository.get).not.toHaveBeenCalled();
        });

        it("should throw if a session with the same session and semester already exists", async () => {
            mockSessionRepository.get.mockResolvedValue(mockAcademicSession);

            await expect(
                service.createSession(
                    mockAcademicSession.session,
                    mockAcademicSession.semester,
                    mockAcademicSession.startTime,
                    mockAcademicSession.endTime,
                    mockAcademicSession.active ?? false,
                ),
            ).rejects.toThrow(
                new ConflictError("sessionService.duplicateSession"),
            );

            expect(mockSessionRepository.create).not.toHaveBeenCalled();
        });
    });

    describe("updateSession", () => {
        it("should successfully update an existing session", async () => {
            mockSessionRepository.get.mockResolvedValue(mockAcademicSession);
            mockSessionRepository.update.mockResolvedValue(undefined);

            await service.updateSession(
                mockAcademicSession.session,
                mockAcademicSession.semester,
                mockAcademicSession.startTime,
                mockAcademicSession.endTime,
                mockAcademicSession.active ?? false,
            );

            expect(mockSessionRepository.update).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
                mockAcademicSession.startTime,
                mockAcademicSession.endTime,
                mockAcademicSession.active ?? false,
            );
        });

        it("should throw if start time is after or equal to end time", async () => {
            await expect(
                service.updateSession(
                    mockAcademicSession.session,
                    mockAcademicSession.semester,
                    new Date("2024-12-15T00:00:00"),
                    new Date("2024-08-01T00:00:00"),
                    false,
                ),
            ).rejects.toThrow(
                new BadRequestError("sessionService.invalidSessionTime"),
            );
        });

        it("should throw if the session to update does not exist", async () => {
            mockSessionRepository.get.mockResolvedValue(null);

            await expect(
                service.updateSession(
                    mockAcademicSession.session,
                    mockAcademicSession.semester,
                    mockAcademicSession.startTime,
                    mockAcademicSession.endTime,
                    mockAcademicSession.active ?? false,
                ),
            ).rejects.toThrow(
                new NotFoundError("sessionService.sessionNotFound"),
            );
        });
    });

    describe("deleteSession", () => {
        it("should successfully delete an existing session", async () => {
            mockSessionRepository.get.mockResolvedValue(mockAcademicSession);

            await service.deleteSession(
                mockAcademicSession.session,
                mockAcademicSession.semester,
            );

            expect(mockSessionRepository.delete).toHaveBeenCalledWith(
                mockAcademicSession.session,
                mockAcademicSession.semester,
            );
        });

        it("should throw if the session to delete does not exist", async () => {
            mockSessionRepository.get.mockResolvedValue(null);

            await expect(
                service.deleteSession(
                    mockAcademicSession.session,
                    mockAcademicSession.semester,
                ),
            ).rejects.toThrow(
                new NotFoundError("sessionService.sessionNotFound"),
            );

            expect(mockSessionRepository.delete).not.toHaveBeenCalled();
        });
    });
});
