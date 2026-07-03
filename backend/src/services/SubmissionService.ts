import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAssignmentRepository, ISubmissionRepository } from "@/repositories";
import { ConflictError, NotFoundError } from "@/types";
import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IAttachmentService, TempFile } from "./IAttachmentService";
import { IFileService, ZipEntry } from "./IFileService";
import { ISubmissionService } from "./ISubmissionService";

/**
 * A service that is responsible for handling operations related to student submissions.
 */
@Injectable(dependencyTokens.submissionService)
export class SubmissionService implements ISubmissionService {
    constructor(
        @inject(dependencyTokens.assignmentRepository)
        private readonly assignmentRepository: IAssignmentRepository,
        @inject(dependencyTokens.submissionRepository)
        private readonly submissionRepository: ISubmissionRepository,
        @inject(dependencyTokens.attachmentService)
        private readonly attachmentService: IAttachmentService,
        @inject(dependencyTokens.fileService)
        private readonly fileService: IFileService,
    ) {}

    async getSubmissions(
        assignmentId: number,
        teacherId: number,
    ): Promise<AssignmentSubmissionRow[]> {
        const assignment = await this.assignmentRepository.getTeacherAssignment(
            assignmentId,
            teacherId,
        );

        if (!assignment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return this.submissionRepository.getForAssignment(assignmentId);
    }

    async downloadSubmissions(
        assignmentId: number,
        teacherId: number,
        studentId?: number,
    ): Promise<Buffer> {
        const assignment = await this.assignmentRepository.getTeacherAssignment(
            assignmentId,
            teacherId,
        );

        if (!assignment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        const rows =
            await this.submissionRepository.getForAssignmentWithAttachments(
                assignmentId,
                studentId,
            );

        const entries: ZipEntry[] = rows.map(
            ({
                studentName,
                studentIdentifier,
                attachmentName,
                attachmentPath,
            }) => ({
                folder: `${studentIdentifier}_${studentName}`,
                filename: attachmentName,
                path: attachmentPath,
            }),
        );

        return this.fileService.createZipArchive(entries);
    }

    async addSubmission(
        assignmentId: number,
        studentId: number,
        files: TempFile[],
    ): Promise<SubjectAssignmentSubmission> {
        const assignment = await this.assignmentRepository.getStudentAssignment(
            assignmentId,
            studentId,
        );

        if (!assignment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        const existing = await this.submissionRepository.getByStudent(
            assignmentId,
            studentId,
        );

        if (existing) {
            throw new ConflictError("submissionService.alreadyExists");
        }

        const savedAttachments = await Promise.all(
            files.map((file) => this.attachmentService.saveFile(file)),
        );

        return this.submissionRepository.add(
            assignmentId,
            studentId,
            savedAttachments.map((a) => a.id),
        );
    }

    async updateSubmission(
        assignmentId: number,
        studentId: number,
        newFiles: TempFile[],
        renamedAttachments: { id: number; newName: string }[],
        deletedAttachmentIds: number[],
    ) {
        const submission = await this.submissionRepository.getByStudent(
            assignmentId,
            studentId,
        );

        if (!submission) {
            throw new NotFoundError("submissionService.notFound");
        }

        await this.attachmentService.delete(deletedAttachmentIds);
        await this.attachmentService.updateRenameAttachments(
            renamedAttachments,
        );

        const savedAttachments = await Promise.all(
            newFiles.map((file) => this.attachmentService.saveFile(file)),
        );

        await this.submissionRepository.addAttachments(
            submission.id,
            savedAttachments.map((a) => a.id),
        );
    }

    async deleteSubmission(assignmentId: number, studentId: number) {
        const submission = await this.submissionRepository.getByStudent(
            assignmentId,
            studentId,
        );

        if (!submission) {
            throw new NotFoundError("submissionService.notFound");
        }

        const attachmentIds = await this.submissionRepository.getAttachmentIds(
            submission.id,
        );

        await this.attachmentService.delete(attachmentIds);
        await this.submissionRepository.delete(submission.id);
    }
}
