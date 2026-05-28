import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAssignmentRepository, ISubmissionRepository } from "@/repositories";
import { NotFoundError } from "@/types";
import { AssignmentSubmissionRow } from "@psb/shared/types";
import { inject } from "tsyringe";
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
    ) {}

    async getSubmissions(
        assignmentId: number,
        teacherId: number,
    ): Promise<AssignmentSubmissionRow[]> {
        const assignment =
            await this.assignmentRepository.getTeacherAssignment(
                assignmentId,
                teacherId,
            );

        if (!assignment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return this.submissionRepository.getForAssignment(assignmentId);
    }
}
