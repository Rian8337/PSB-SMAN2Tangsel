import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAssignmentRepository, ISubmissionRepository } from "@/repositories";
import { NotFoundError } from "@/types";
import { AssignmentSubmissionRow } from "@psb/shared/types";
import { inject } from "tsyringe";
import { IFileService, ZipEntry } from "./IFileService";
import { ISubmissionService } from "./ISubmissionService";

/**
 * A service that is responsible for handling operations related to viewing student submissions.
 */
@Injectable(dependencyTokens.submissionService)
export class SubmissionService implements ISubmissionService {
    constructor(
        @inject(dependencyTokens.assignmentRepository)
        private readonly assignmentRepository: IAssignmentRepository,
        @inject(dependencyTokens.submissionRepository)
        private readonly submissionRepository: ISubmissionRepository,
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
}
