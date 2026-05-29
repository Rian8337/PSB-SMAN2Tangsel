import { SubmissionService } from "@/services/SubmissionService";
import { ConflictError, NotFoundError } from "@/types";
import {
    AssignmentSubmissionRow,
    StudentSubjectAssignment,
    SubjectAssignmentSubmission,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import {
    mockAssignmentRepository,
    mockAttachmentService,
    mockFileService,
    mockSubmissionRepository,
} from "@test/mocks";

describe("SubmissionService (unit)", () => {
    const service = new SubmissionService(
        mockAssignmentRepository,
        mockSubmissionRepository,
        mockAttachmentService,
        mockFileService,
    );

    const mockStudentAssignment: StudentSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
        title: "Latihan 1",
        description: null,
        dueAt: null,
        createdAt: "2026-01-15T00:00:00.000Z",
        lastUpdatedAt: "2026-01-23T00:00:00.000Z",
        attachments: [],
        submission: null,
    };

    const mockSubmission: SubjectAssignmentSubmission = {
        id: 5,
        submittedAt: "2026-02-18T12:57:32.000Z",
        attachments: [{ id: 10, name: "report.pdf" }],
    };

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

    describe("downloadSubmissions", () => {
        const mockDownloadRows = [
            {
                studentName: "Reza Mouna Hendrian",
                studentIdentifier: "0019217804",
                attachmentName: "homework.pdf",
                attachmentPath: "attachments/abc123.pdf",
            },
        ];

        const mockZipBuffer = Buffer.from("zip content");

        it("should throw NotFoundError when the teacher does not own the assignment", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                null,
            );

            await expect(service.downloadSubmissions(99, 2)).rejects.toThrow(
                new NotFoundError("assignmentService.notFound"),
            );

            expect(
                mockSubmissionRepository.getForAssignmentWithAttachments,
            ).not.toHaveBeenCalled();

            expect(mockFileService.createZipArchive).not.toHaveBeenCalled();
        });

        it("should call getForAssignmentWithAttachments and createZipArchive, and return the buffer", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            mockSubmissionRepository.getForAssignmentWithAttachments.mockResolvedValue(
                mockDownloadRows,
            );

            mockFileService.createZipArchive.mockResolvedValue(mockZipBuffer);

            const result = await service.downloadSubmissions(1, 2);

            expect(
                mockAssignmentRepository.getTeacherAssignment,
            ).toHaveBeenCalledWith(1, 2);

            expect(
                mockSubmissionRepository.getForAssignmentWithAttachments,
            ).toHaveBeenCalledWith(1, undefined);

            expect(mockFileService.createZipArchive).toHaveBeenCalledWith([
                {
                    folder: "0019217804_Reza Mouna Hendrian",
                    filename: "homework.pdf",
                    path: "attachments/abc123.pdf",
                },
            ]);

            expect(result).toBe(mockZipBuffer);
        });

        it("should pass studentId to getForAssignmentWithAttachments when provided", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            mockSubmissionRepository.getForAssignmentWithAttachments.mockResolvedValue(
                mockDownloadRows,
            );

            mockFileService.createZipArchive.mockResolvedValue(mockZipBuffer);

            await service.downloadSubmissions(1, 2, 3);

            expect(
                mockSubmissionRepository.getForAssignmentWithAttachments,
            ).toHaveBeenCalledWith(1, 3);
        });

        it("should call createZipArchive with an empty array when there are no attachments", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            mockSubmissionRepository.getForAssignmentWithAttachments.mockResolvedValue(
                [],
            );

            mockFileService.createZipArchive.mockResolvedValue(mockZipBuffer);

            await service.downloadSubmissions(1, 2);

            expect(mockFileService.createZipArchive).toHaveBeenCalledWith([]);
        });
    });

    describe("addSubmission", () => {
        it("should throw NotFoundError when the assignment is not accessible to the student", async () => {
            mockAssignmentRepository.getStudentAssignment.mockResolvedValue(
                null,
            );

            await expect(service.addSubmission(1, 3, [])).rejects.toThrow(
                new NotFoundError("assignmentService.notFound"),
            );

            expect(mockSubmissionRepository.getByStudent).not.toHaveBeenCalled();
        });

        it("should throw ConflictError when the student already has a submission", async () => {
            mockAssignmentRepository.getStudentAssignment.mockResolvedValue(
                mockStudentAssignment,
            );

            mockSubmissionRepository.getByStudent.mockResolvedValue(
                mockSubmission,
            );

            await expect(service.addSubmission(1, 3, [])).rejects.toThrow(
                new ConflictError("submissionService.alreadyExists"),
            );

            expect(mockAttachmentService.saveFile).not.toHaveBeenCalled();
        });

        it("should save files and create the submission when no submission exists", async () => {
            mockAssignmentRepository.getStudentAssignment.mockResolvedValue(
                mockStudentAssignment,
            );

            mockSubmissionRepository.getByStudent.mockResolvedValue(null);

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 10,
                name: "report.pdf",
            });

            mockSubmissionRepository.add.mockResolvedValue(mockSubmission);

            const result = await service.addSubmission(1, 3, [
                { path: "/tmp/upload", originalFilename: "report.pdf" },
            ]);

            expect(mockAttachmentService.saveFile).toHaveBeenCalledWith({
                path: "/tmp/upload",
                originalFilename: "report.pdf",
            });

            expect(mockSubmissionRepository.add).toHaveBeenCalledWith(
                1,
                3,
                [10],
            );

            expect(result).toEqual(mockSubmission);
        });
    });

    describe("updateSubmission", () => {
        it("should throw NotFoundError when the student has no submission", async () => {
            mockSubmissionRepository.getByStudent.mockResolvedValue(null);

            await expect(
                service.updateSubmission(1, 3, [], [], []),
            ).rejects.toThrow(
                new NotFoundError("submissionService.notFound"),
            );

            expect(mockAttachmentService.delete).not.toHaveBeenCalled();
        });

        it("should delete, rename, save new files, and add attachments on success", async () => {
            mockSubmissionRepository.getByStudent.mockResolvedValue(
                mockSubmission,
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 20,
                name: "new.pdf",
            });

            await service.updateSubmission(
                1,
                3,
                [{ path: "/tmp/new", originalFilename: "new.pdf" }],
                [{ id: 10, newName: "renamed.pdf" }],
                [99],
            );

            expect(mockAttachmentService.delete).toHaveBeenCalledWith([99]);
            expect(
                mockAttachmentService.updateRenameAttachments,
            ).toHaveBeenCalledWith([{ id: 10, newName: "renamed.pdf" }]);
            expect(mockAttachmentService.saveFile).toHaveBeenCalledWith({
                path: "/tmp/new",
                originalFilename: "new.pdf",
            });
            expect(mockSubmissionRepository.addAttachments).toHaveBeenCalledWith(
                5,
                [20],
            );
        });
    });

    describe("deleteSubmission", () => {
        it("should throw NotFoundError when the student has no submission", async () => {
            mockSubmissionRepository.getByStudent.mockResolvedValue(null);

            await expect(service.deleteSubmission(1, 3)).rejects.toThrow(
                new NotFoundError("submissionService.notFound"),
            );

            expect(mockAttachmentService.delete).not.toHaveBeenCalled();
        });

        it("should delete attachment files and the submission record", async () => {
            mockSubmissionRepository.getByStudent.mockResolvedValue(
                mockSubmission,
            );

            mockSubmissionRepository.getAttachmentIds.mockResolvedValue([10]);

            await service.deleteSubmission(1, 3);

            expect(
                mockSubmissionRepository.getAttachmentIds,
            ).toHaveBeenCalledWith(5);

            expect(mockAttachmentService.delete).toHaveBeenCalledWith([10]);
            expect(mockSubmissionRepository.delete).toHaveBeenCalledWith(5);
        });
    });
});
