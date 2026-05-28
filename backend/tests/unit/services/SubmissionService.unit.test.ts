import { SubmissionService } from "@/services/SubmissionService";
import { NotFoundError } from "@/types";
import {
    AssignmentSubmissionRow,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import {
    mockAssignmentRepository,
    mockSubmissionRepository,
} from "@test/mocks";

describe("SubmissionService (unit)", () => {
    const service = new SubmissionService(
        mockAssignmentRepository,
        mockSubmissionRepository,
    );

    const mockTeacherAssignment: TeacherSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
        title: "Latihan Persamaan Linear Tiga Variabel",
        description: null,
        dueAt: "2026-02-21T18:00:00.000Z",
        visible: true,
        createdAt: "2026-01-15T00:00:00.000Z",
        lastUpdatedAt: "2026-01-23T00:00:00.000Z",
        attachments: [],
    };

    const mockSubmissionRows: AssignmentSubmissionRow[] = [
        {
            studentId: 3,
            studentIdentifier: "0019217804",
            studentName: "Reza Mouna Hendrian",
            submittedAt: "2026-02-18T12:57:32.000Z",
        },
    ];

    describe("getSubmissions", () => {
        it("should return submission rows when the teacher owns the assignment", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            mockSubmissionRepository.getForAssignment.mockResolvedValue(
                mockSubmissionRows,
            );

            const result = await service.getSubmissions(1, 2);

            expect(
                mockAssignmentRepository.getTeacherAssignment,
            ).toHaveBeenCalledWith(1, 2);

            expect(
                mockSubmissionRepository.getForAssignment,
            ).toHaveBeenCalledWith(1);

            expect(result).toEqual(mockSubmissionRows);
        });

        it("should throw NotFoundError when the teacher does not own the assignment", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                null,
            );

            await expect(service.getSubmissions(99, 2)).rejects.toThrow(
                new NotFoundError("assignmentService.notFound"),
            );

            expect(
                mockSubmissionRepository.getForAssignment,
            ).not.toHaveBeenCalled();
        });

        it("should return an empty array when no students have submitted", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            mockSubmissionRepository.getForAssignment.mockResolvedValue([]);

            const result = await service.getSubmissions(1, 2);

            expect(result).toEqual([]);
        });
    });
});
