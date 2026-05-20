import { ClassSubjectService } from "@/services/ClassSubjectService";
import { ConflictError, NotFoundError } from "@/types";
import { Class, Subject, SubjectDashboard } from "@psb/shared/types";
import {
    mockClassRepository,
    mockClassSubjectRepository,
    mockSubjectRepository,
} from "@test/mocks";

describe("ClassSubjectService (unit)", () => {
    const service = new ClassSubjectService(
        mockClassSubjectRepository,
        mockClassRepository,
        mockSubjectRepository,
    );

    const mockClass: Class = {
        id: 1,
        name: "Test Class",
        session: "2024/2025",
        semester: 2,
    };

    const mockSubject: Subject = {
        id: 1,
        name: "Matematika",
        code: "MA101",
        active: true,
    };

    describe("listAssignedSubjects", () => {
        it("should call repository.listAssignedSubjects with correct parameters", async () => {
            await service.listAssignedSubjects(10, "Math", 15, 30);

            expect(
                mockClassSubjectRepository.listAssignedSubjects,
            ).toHaveBeenCalledWith(10, "Math", 15, 30);
        });
    });

    describe("listAssignedSubjectsForTeacher", () => {
        it("should call repository.listAssignedSubjectsForTeacher with correct parameters", async () => {
            await service.listAssignedSubjectsForTeacher(
                1,
                "2024/2025",
                2,
                "Math",
                15,
                30,
            );

            expect(
                mockClassSubjectRepository.listAssignedSubjectsForTeacher,
            ).toHaveBeenCalledWith(1, "2024/2025", 2, "Math", 15, 30);
        });
    });

    describe("listUnassignedSubjects", () => {
        it("should call repository.listUnassignedSubjects with correct parameters", async () => {
            await service.listUnassignedSubjects(10, "Phys", 5, 0);

            expect(
                mockClassSubjectRepository.listUnassignedSubjects,
            ).toHaveBeenCalledWith(10, "Phys", 5, 0);
        });
    });

    describe("assignSubject", () => {
        it("should throw if the class does not exist", async () => {
            mockClassRepository.getById.mockResolvedValue(null);

            await expect(service.assignSubject(10, 101, 5)).rejects.toThrow(
                new NotFoundError("classService.classNotFound"),
            );

            expect(mockClassRepository.getById).toHaveBeenCalledWith(10);
            expect(mockSubjectRepository.getById).not.toHaveBeenCalled();

            expect(
                mockClassSubjectRepository.assignSubject,
            ).not.toHaveBeenCalled();
        });

        it("should throw if the subject does not exist", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);
            mockSubjectRepository.getById.mockResolvedValue(null);

            await expect(service.assignSubject(10, 101, 5)).rejects.toThrow(
                new NotFoundError("subjectService.subjectNotFound"),
            );

            expect(mockSubjectRepository.getById).toHaveBeenCalledWith(101);

            expect(
                mockClassSubjectRepository.assignSubject,
            ).not.toHaveBeenCalled();
        });

        it("should assign the subject if both class and subject exist", async () => {
            mockClassRepository.getById.mockResolvedValue(mockClass);
            mockSubjectRepository.getById.mockResolvedValue(mockSubject);

            await service.assignSubject(10, 101, 5);

            expect(
                mockClassSubjectRepository.assignSubject,
            ).toHaveBeenCalledWith(10, 101, 5);
        });
    });

    describe("updateAssignedSubject", () => {
        it("should call repository.updateAssignedSubject with correct parameters", async () => {
            await service.updateAssignedSubject(10, 42, 99);

            expect(
                mockClassSubjectRepository.updateAssignedSubject,
            ).toHaveBeenCalledWith(10, 42, 99);
        });
    });

    describe("unassignSubject", () => {
        it("should throw if there is associated content", async () => {
            mockClassSubjectRepository.hasAssociatedContent.mockResolvedValue(
                true,
            );

            await expect(service.unassignSubject(10, 42)).rejects.toThrow(
                new ConflictError("classSubjectService.classHasContent"),
            );

            expect(
                mockClassSubjectRepository.hasAssociatedContent,
            ).toHaveBeenCalledWith(42);

            expect(
                mockClassSubjectRepository.unassignSubject,
            ).not.toHaveBeenCalled();
        });

        it("should delete the assignment if there is no associated content", async () => {
            mockClassSubjectRepository.hasAssociatedContent.mockResolvedValue(
                false,
            );

            await service.unassignSubject(10, 42);

            expect(
                mockClassSubjectRepository.unassignSubject,
            ).toHaveBeenCalledWith(10, 42);
        });
    });

    const mockDashboard: SubjectDashboard = {
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        class: { id: 1, name: "X-IPA-1" },
        materials: [],
        assignments: [],
    };

    describe("getStudentDashboard", () => {
        it("should return the dashboard when the repository returns data", async () => {
            mockClassSubjectRepository.getStudentDashboard.mockResolvedValue(
                mockDashboard,
            );

            const result = await service.getStudentDashboard(1, 3);

            expect(
                mockClassSubjectRepository.getStudentDashboard,
            ).toHaveBeenCalledWith(1, 3);
            expect(result).toBe(mockDashboard);
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockClassSubjectRepository.getStudentDashboard.mockResolvedValue(
                null,
            );

            await expect(service.getStudentDashboard(99, 3)).rejects.toThrow(
                new NotFoundError("classSubjectService.notFound"),
            );
        });
    });

    describe("getTeacherDashboard", () => {
        it("should return the dashboard when the repository returns data", async () => {
            mockClassSubjectRepository.getTeacherDashboard.mockResolvedValue(
                mockDashboard,
            );

            const result = await service.getTeacherDashboard(1, 2);

            expect(
                mockClassSubjectRepository.getTeacherDashboard,
            ).toHaveBeenCalledWith(1, 2);
            expect(result).toBe(mockDashboard);
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockClassSubjectRepository.getTeacherDashboard.mockResolvedValue(
                null,
            );

            await expect(service.getTeacherDashboard(99, 2)).rejects.toThrow(
                new NotFoundError("classSubjectService.notFound"),
            );
        });
    });
});
