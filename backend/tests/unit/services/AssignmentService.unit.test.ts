import { AssignmentService } from "@/services/AssignmentService";
import { NotFoundError } from "@/types";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import {
    mockAssignmentRepository,
    mockAttachmentService,
    mockClassSubjectRepository,
    mockNotificationService,
} from "@test/mocks";

describe("AssignmentService (unit)", () => {
    const service = new AssignmentService(
        mockAssignmentRepository,
        mockAttachmentService,
        mockClassSubjectRepository,
        mockNotificationService,
    );

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

    describe("addAssignment", () => {
        const mockAssignment: TeacherSubjectAssignment = {
            id: 5,
            classSubjectId: 10,
            subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
            title: "Tugas Baru",
            description: null,
            dueAt: null,
            visible: false,
            createdAt: "2026-01-15T00:00:00.000Z",
            lastUpdatedAt: "2026-01-15T00:00:00.000Z",
            attachments: [],
        };

        it("should throw NotFoundError when the teacher is not assigned to the class subject", async () => {
            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                null,
            );

            await expect(
                service.addAssignment({
                    classSubjectId: 10,
                    teacherId: 2,
                    title: "Title",
                    description: null,
                    dueAt: null,
                    visible: false,
                    files: [],
                }),
            ).rejects.toThrow(new NotFoundError("assignmentService.notFound"));
        });

        it("should save files, create assignment, return the created assignment, and not send a notification when not visible", async () => {
            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                { id: 10, classId: 3, session: "2024/2025", semester: 1 },
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 7,
                name: "soal.pdf",
            });

            mockAssignmentRepository.addAssignment.mockResolvedValue(
                mockAssignment,
            );

            mockNotificationService.publishToClass.mockResolvedValue(undefined);

            const result = await service.addAssignment({
                classSubjectId: 10,
                teacherId: 2,
                title: "Tugas Baru",
                description: null,
                dueAt: null,
                visible: false,
                files: [
                    { path: "/tmp/soal.pdf", originalFilename: "soal.pdf" },
                ],
            });

            expect(
                mockClassSubjectRepository.getTeacherClassSubject,
            ).toHaveBeenCalledWith(10, 2);

            expect(mockAttachmentService.saveFile).toHaveBeenCalledOnce();

            expect(mockAssignmentRepository.addAssignment).toHaveBeenCalledWith(
                10,
                "Tugas Baru",
                null,
                null,
                false,
                [7],
            );

            expect(result).toEqual(mockAssignment);

            expect(
                mockNotificationService.publishToClass,
            ).not.toHaveBeenCalled();
        });

        it("should send a session-scoped notification when the assignment is visible", async () => {
            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                { id: 10, classId: 3, session: "2024/2025", semester: 1 },
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 7,
                name: "soal.pdf",
            });

            mockAssignmentRepository.addAssignment.mockResolvedValue({
                ...mockAssignment,
                visible: true,
            });

            mockNotificationService.publishToClass.mockResolvedValue(undefined);

            await service.addAssignment({
                classSubjectId: 10,
                teacherId: 2,
                title: "Tugas Baru",
                description: "Deskripsi",
                dueAt: null,
                visible: true,
                files: [
                    { path: "/tmp/soal.pdf", originalFilename: "soal.pdf" },
                ],
            });

            expect(mockNotificationService.publishToClass).toHaveBeenCalledWith(
                3,
                "Tugas Baru",
                "Deskripsi",
                "/24251/subjects/10/assignments/5",
            );
        });
    });

    describe("updateAssignment", () => {
        const mockExisting: TeacherSubjectAssignment = {
            id: 1,
            classSubjectId: 10,
            subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
            title: "Judul Lama",
            description: null,
            dueAt: null,
            visible: true,
            createdAt: "2026-01-15T00:00:00.000Z",
            lastUpdatedAt: "2026-01-15T00:00:00.000Z",
            attachments: [{ id: 2, name: "existing.pdf" }],
        };

        it("should throw NotFoundError when the assignment does not belong to the teacher", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                null,
            );

            await expect(
                service.updateAssignment({
                    assignmentId: 1,
                    teacherId: 2,
                    title: "T",
                    description: null,
                    dueAt: null,
                    visible: true,
                    newFiles: [],
                    renamedAttachments: [],
                    deletedAttachmentIds: [],
                }),
            ).rejects.toThrow(new NotFoundError("assignmentService.notFound"));
        });

        it("should delete, rename, save new files and call updateAssignment with correct keepIds", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockExisting,
            );

            mockAttachmentService.delete.mockResolvedValue(undefined);

            mockAttachmentService.updateRenameAttachments.mockResolvedValue(
                undefined,
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 9,
                name: "new.pdf",
            });

            mockAssignmentRepository.updateAssignment.mockResolvedValue(
                undefined,
            );

            await service.updateAssignment({
                assignmentId: 1,
                teacherId: 2,
                title: "Judul Baru",
                description: "Deskripsi",
                dueAt: null,
                visible: false,
                newFiles: [
                    { path: "/tmp/new.pdf", originalFilename: "new.pdf" },
                ],
                renamedAttachments: [],
                deletedAttachmentIds: [2],
            });

            expect(mockAttachmentService.delete).toHaveBeenCalledWith([2]);

            expect(
                mockAttachmentService.updateRenameAttachments,
            ).toHaveBeenCalledWith([]);

            expect(
                mockAssignmentRepository.updateAssignment,
            ).toHaveBeenCalledWith(
                1,
                "Judul Baru",
                "Deskripsi",
                null,
                false,
                [9],
            );

            expect(
                mockNotificationService.publishToClass,
            ).not.toHaveBeenCalled();
        });

        it("should not send a notification when visibility stays the same", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockExisting, // visible: true
            );

            mockAttachmentService.delete.mockResolvedValue(undefined);
            mockAttachmentService.updateRenameAttachments.mockResolvedValue(
                undefined,
            );
            mockAssignmentRepository.updateAssignment.mockResolvedValue(
                undefined,
            );

            await service.updateAssignment({
                assignmentId: 1,
                teacherId: 2,
                title: "Judul Baru",
                description: "Deskripsi",
                dueAt: null,
                visible: true, // already visible, stays visible
                newFiles: [],
                renamedAttachments: [],
                deletedAttachmentIds: [],
            });

            expect(
                mockNotificationService.publishToClass,
            ).not.toHaveBeenCalled();
        });

        it("should send a session-scoped notification when visibility transitions from hidden to visible", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue({
                ...mockExisting,
                visible: false,
            });

            mockAttachmentService.delete.mockResolvedValue(undefined);
            mockAttachmentService.updateRenameAttachments.mockResolvedValue(
                undefined,
            );
            mockAssignmentRepository.updateAssignment.mockResolvedValue(
                undefined,
            );

            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                { id: 10, classId: 3, session: "2024/2025", semester: 2 },
            );

            mockNotificationService.publishToClass.mockResolvedValue(undefined);

            await service.updateAssignment({
                assignmentId: 1,
                teacherId: 2,
                title: "Judul Baru",
                description: "Deskripsi",
                dueAt: null,
                visible: true,
                newFiles: [],
                renamedAttachments: [],
                deletedAttachmentIds: [],
            });

            expect(
                mockClassSubjectRepository.getTeacherClassSubject,
            ).toHaveBeenCalledWith(10, 2);

            expect(mockNotificationService.publishToClass).toHaveBeenCalledWith(
                3,
                "Judul Baru",
                "Deskripsi",
                "/24252/subjects/10/assignments/1",
            );
        });
    });

    describe("deleteAssignment", () => {
        it("should throw NotFoundError when the assignment does not belong to the teacher", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                null,
            );

            await expect(service.deleteAssignment(1, 2)).rejects.toThrow(
                new NotFoundError("assignmentService.notFound"),
            );
        });

        it("should delete all attachments (assignment + submissions) and then the assignment", async () => {
            mockAssignmentRepository.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            mockAssignmentRepository.getAssignmentAttachmentIds.mockResolvedValue(
                [3],
            );

            mockAssignmentRepository.getSubmissionAttachmentIds.mockResolvedValue(
                [8],
            );

            mockAttachmentService.delete.mockResolvedValue(undefined);

            mockAssignmentRepository.deleteAssignment.mockResolvedValue(
                undefined,
            );

            await service.deleteAssignment(1, 2);

            expect(
                mockAssignmentRepository.getAssignmentAttachmentIds,
            ).toHaveBeenCalledWith(1);

            expect(
                mockAssignmentRepository.getSubmissionAttachmentIds,
            ).toHaveBeenCalledWith(1);

            expect(mockAttachmentService.delete).toHaveBeenCalledWith([3, 8]);

            expect(
                mockAssignmentRepository.deleteAssignment,
            ).toHaveBeenCalledWith(1);
        });
    });
});
