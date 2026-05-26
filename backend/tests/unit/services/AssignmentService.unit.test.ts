import { AssignmentService } from "@/services/AssignmentService";
import { NotFoundError } from "@/types";
import { StudentSubjectAssignment, TeacherSubjectAssignment } from "@psb/shared/types";
import { mockAssignmentRepository } from "@test/mocks";

describe("AssignmentService (unit)", () => {
    const service = new AssignmentService(mockAssignmentRepository);

    const mockStudentAssignment: StudentSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
        title: "Latihan Persamaan Linear Tiga Variabel",
        description: "Kerjakan menggunakan tulisan tangan di secarik kertas.",
        dueAt: "2026-02-21T18:00:00.000Z",
        createdAt: "2026-01-15T00:00:00.000Z",
        lastUpdatedAt: "2026-01-23T00:00:00.000Z",
        attachments: [{ id: 1, name: "soal.pdf" }],
        submission: null,
    };

    const mockTeacherAssignment: TeacherSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
        title: "Latihan Persamaan Linear Tiga Variabel",
        description: "Kerjakan menggunakan tulisan tangan di secarik kertas.",
        dueAt: "2026-02-21T18:00:00.000Z",
        visible: true,
        createdAt: "2026-01-15T00:00:00.000Z",
        lastUpdatedAt: "2026-01-23T00:00:00.000Z",
        attachments: [{ id: 1, name: "soal.pdf" }],
    };

    describe("getStudentAssignment", () => {
        it("should return the assignment when the repository returns one", async () => {
            mockAssignmentRepository.getStudentAssignment.mockResolvedValue(
                mockStudentAssignment,
            );

            const result = await service.getStudentAssignment(1, 3);

            expect(
                mockAssignmentRepository.getStudentAssignment,
            ).toHaveBeenCalledWith(1, 3);
            expect(result).toEqual(mockStudentAssignment);
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockAssignmentRepository.getStudentAssignment.mockResolvedValue(
                null,
            );

            await expect(service.getStudentAssignment(99, 3)).rejects.toThrow(
                new NotFoundError("assignmentService.notFound"),
            );
        });
    });

    describe("getTeacherAssignment", () => {
        it("should return the assignment when the repository returns one", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            const result = await service.getTeacherAssignment(1, 2);

            expect(
                mockAssignmentRepository.getTeacherAssignment,
            ).toHaveBeenCalledWith(1, 2);
            expect(result).toEqual(mockTeacherAssignment);
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                null,
            );

            await expect(service.getTeacherAssignment(99, 2)).rejects.toThrow(
                new NotFoundError("assignmentService.notFound"),
            );
        });
    });

    describe("getStudentAttachment", () => {
        it("should return the attachment when the repository returns one", async () => {
            mockAssignmentRepository.getStudentAttachment.mockResolvedValue({
                path: "soal.pdf",
                name: "soal.pdf",
            });

            const result = await service.getStudentAttachment(1, 1, 3);

            expect(
                mockAssignmentRepository.getStudentAttachment,
            ).toHaveBeenCalledWith(1, 1, 3);
            expect(result).toEqual({ path: "soal.pdf", name: "soal.pdf" });
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockAssignmentRepository.getStudentAttachment.mockResolvedValue(
                null,
            );

            await expect(
                service.getStudentAttachment(1, 99, 3),
            ).rejects.toThrow(new NotFoundError("assignmentService.notFound"));
        });
    });

    describe("getTeacherAttachment", () => {
        it("should return the attachment when the repository returns one", async () => {
            mockAssignmentRepository.getTeacherAttachment.mockResolvedValue({
                path: "soal.pdf",
                name: "soal.pdf",
            });

            const result = await service.getTeacherAttachment(1, 1, 2);

            expect(
                mockAssignmentRepository.getTeacherAttachment,
            ).toHaveBeenCalledWith(1, 1, 2);
            expect(result).toEqual({ path: "soal.pdf", name: "soal.pdf" });
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockAssignmentRepository.getTeacherAttachment.mockResolvedValue(
                null,
            );

            await expect(
                service.getTeacherAttachment(1, 99, 2),
            ).rejects.toThrow(new NotFoundError("assignmentService.notFound"));
        });
    });
});
