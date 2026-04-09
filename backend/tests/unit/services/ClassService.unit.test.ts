import { ClassService } from "@/services";
import { ConflictError, NotFoundError } from "@/types";
import { AcademicSession, Class } from "@psb/shared/types";
import { mockClassRepository, mockSessionRepository } from "@test/mocks";

describe("ClassService (unit)", () => {
    const service = new ClassService(
        mockClassRepository,
        mockSessionRepository,
    );

    const mockSession: AcademicSession = {
        active: true,
        startTime: new Date("2023-07-01"),
        endTime: new Date("2023-12-15"),
        session: "2023/2024",
        semester: 1,
    };

    const mockClass: Class = {
        id: 1,
        name: "X IPA 1",
        session: mockSession.session,
        semester: mockSession.semester,
    };

    describe("getClassById", () => {
        it("should return the class when it exists", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);

            const result = await service.getClassById(1);

            expect(mockClassRepository.getById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockClass);
        });

        it("should throw if class does not exist", async () => {
            mockClassRepository.getById.mockResolvedValue(null);

            await expect(service.getClassById(999)).rejects.toThrow(
                new NotFoundError("classService.classNotFound"),
            );
        });
    });

    describe("listClasses", () => {
        it("should list classes with provided session and semester", async () => {
            const mockClasses = [mockClass];

            mockClassRepository.list.mockResolvedValue(mockClasses);

            const result = await service.listClasses({
                session: mockSession.session,
                semester: mockSession.semester,
                limit: 10,
            });

            expect(mockClassRepository.list).toHaveBeenCalledWith(
                mockSession.session,
                mockSession.semester,
                undefined,
                10,
                undefined,
            );

            expect(result).toEqual(mockClasses);
            expect(mockSessionRepository.getActive).not.toHaveBeenCalled();
        });

        it("should fallback to active session and semester if not provided", async () => {
            mockSessionRepository.getActive.mockResolvedValue(mockSession);
            const mockClasses = [mockClass];

            mockClassRepository.list.mockResolvedValue(mockClasses);

            const result = await service.listClasses({
                limit: 10,
            });

            expect(mockClassRepository.list).toHaveBeenCalledWith(
                mockSession.session,
                mockSession.semester,
                undefined,
                10,
                undefined,
            );

            expect(result).toEqual(mockClasses);
            expect(mockSessionRepository.getActive).toHaveBeenCalled();
        });

        it("should return empty array if no active session exists during fallback", async () => {
            mockSessionRepository.getActive.mockResolvedValue(null);

            const result = await service.listClasses();

            expect(result).toEqual([]);
            expect(mockClassRepository.list).not.toHaveBeenCalled();
        });
    });

    describe("createClass", () => {
        it("should create a class if the session exists", async () => {
            mockSessionRepository.get.mockResolvedValue(mockSession);

            await service.createClass(
                "X IPA 2",
                mockSession.session,
                mockSession.semester,
            );

            expect(mockSessionRepository.get).toHaveBeenCalledWith(
                mockSession.session,
                mockSession.semester,
            );

            expect(mockClassRepository.create).toHaveBeenCalledWith(
                "X IPA 2",
                mockSession.session,
                mockSession.semester,
            );
        });

        it("should throw if the session does not exist", async () => {
            mockSessionRepository.get.mockResolvedValue(null);

            await expect(
                service.createClass(
                    "X IPA 2",
                    mockSession.session,
                    mockSession.semester,
                ),
            ).rejects.toThrow(
                new NotFoundError("sessionService.sessionNotFound"),
            );

            expect(mockClassRepository.create).not.toHaveBeenCalled();
        });
    });

    describe("deleteClass", () => {
        it("should successfully delete a class that has no subjects or students", async () => {
            mockClassRepository.hasStudents.mockResolvedValue(false);
            mockClassRepository.hasSubjects.mockResolvedValue(false);

            await service.deleteClass(1);

            expect(mockClassRepository.hasStudents).toHaveBeenCalledWith(1);
            expect(mockClassRepository.hasSubjects).toHaveBeenCalledWith(1);
            expect(mockClassRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw if the class has enrolled students", async () => {
            mockClassRepository.hasStudents.mockResolvedValue(true);
            mockClassRepository.hasSubjects.mockResolvedValue(false);

            await expect(service.deleteClass(1)).rejects.toThrow(
                new ConflictError("classService.classInUse"),
            );
        });

        it("should throw if the class has assigned subjects", async () => {
            mockClassRepository.hasStudents.mockResolvedValue(false);
            mockClassRepository.hasSubjects.mockResolvedValue(true);

            await expect(service.deleteClass(1)).rejects.toThrow(
                new ConflictError("classService.classInUse"),
            );
        });
    });
});
