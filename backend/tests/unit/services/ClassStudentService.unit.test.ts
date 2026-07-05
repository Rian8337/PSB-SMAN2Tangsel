import { ClassStudentService } from "@/services";
import { ConflictError, NotFoundError } from "@/types";
import { Class, UserListItem, UserRole } from "@psb/shared/types";
import { mockClassRepository, mockClassStudentRepository } from "@test/mocks";

describe("ClassStudentService", () => {
    const service = new ClassStudentService(
        mockClassRepository,
        mockClassStudentRepository,
    );

    const mockClass: Class = {
        id: 1,
        name: "X IPA 1",
        session: "2023/2024",
        semester: 1,
    };

    const mockStudents: UserListItem[] = [
        {
            id: 100,
            name: "Budi",
            identifier: "123",
            role: UserRole.Student,
            active: true,
        },
    ];

    describe("getEnrolledStudents", () => {
        it("should return enrolled students directly from the repository", async () => {
            mockClassStudentRepository.getEnrolledStudents.mockResolvedValue(
                mockStudents,
            );

            const result = await service.getEnrolledStudents(1, "Budi", 10, 0);

            expect(
                mockClassStudentRepository.getEnrolledStudents,
            ).toHaveBeenCalledWith(1, "Budi", 10, 0);
            expect(result).toEqual(mockStudents);
        });
    });

    describe("getUnenrolledStudents", () => {
        it("should throw if the class does not exist", async () => {
            mockClassRepository.getById.mockResolvedValue(null);

            await expect(service.getUnenrolledStudents(99)).rejects.toThrow(
                new NotFoundError("classService.classNotFound"),
            );

            expect(
                mockClassStudentRepository.getUnenrolledStudents,
            ).not.toHaveBeenCalled();
        });

        it("should fetch unenrolled students using the class session and semester", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);

            mockClassStudentRepository.getUnenrolledStudents.mockResolvedValue(
                mockStudents,
            );

            const result = await service.getUnenrolledStudents(
                1,
                "query",
                5,
                0,
            );

            expect(
                mockClassStudentRepository.getUnenrolledStudents,
            ).toHaveBeenCalledWith(
                mockClass.session,
                mockClass.semester,
                "query",
                5,
                0,
            );

            expect(result).toEqual(mockStudents);
        });
    });

    describe("enrollStudent", () => {
        it("should throw if the class does not exist", async () => {
            mockClassRepository.getById.mockResolvedValue(null);

            await expect(service.enrollStudent(99, 100)).rejects.toThrow(
                new NotFoundError("classService.classNotFound"),
            );

            expect(
                mockClassStudentRepository.enrollStudent,
            ).not.toHaveBeenCalled();
        });

        it("should return immediately (idempotent) if student is already enrolled in this exact class", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);

            // Simulate active enrollment in the same class.
            mockClassStudentRepository.findActiveEnrollment.mockResolvedValue(
                mockClass,
            );

            await service.enrollStudent(1, 100);

            expect(
                mockClassStudentRepository.findActiveEnrollment,
            ).toHaveBeenCalledWith(100, mockClass.session, mockClass.semester);

            expect(
                mockClassStudentRepository.enrollStudent,
            ).not.toHaveBeenCalled();
        });

        it("should throw if student is enrolled in a different class this semester", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);

            // Simulate active enrollment in a different class.
            mockClassStudentRepository.findActiveEnrollment.mockResolvedValue({
                id: 2,
                name: "X IPA 2",
                session: mockClass.session,
                semester: mockClass.semester,
            });

            await expect(service.enrollStudent(1, 100)).rejects.toThrow(
                new ConflictError("classStudentService.studentIsEnrolled", {
                    className: "X IPA 2",
                }),
            );

            expect(
                mockClassStudentRepository.enrollStudent,
            ).not.toHaveBeenCalled();
        });

        it("should successfully enroll the student if they have no active enrollments", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);

            mockClassStudentRepository.findActiveEnrollment.mockResolvedValue(
                null,
            );

            await service.enrollStudent(1, 100);

            expect(
                mockClassStudentRepository.enrollStudent,
            ).toHaveBeenCalledWith(1, 100);
        });
    });

    describe("unenrollStudent", () => {
        it("should pass the classId and studentId to the repository", async () => {
            await service.unenrollStudent(1, 100);

            expect(
                mockClassStudentRepository.unenrollStudent,
            ).toHaveBeenCalledWith(1, 100);
        });
    });
});
