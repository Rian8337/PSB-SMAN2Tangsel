import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAssignmentRepository } from "@/repositories";
import { NotFoundError } from "@/types";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IAssignmentService } from "./IAssignmentService";

/**
 * A service that is responsible for handling operations related to assignment viewing.
 */
@Injectable(dependencyTokens.assignmentService)
export class AssignmentService implements IAssignmentService {
    constructor(
        @inject(dependencyTokens.assignmentRepository)
        private readonly assignmentRepository: IAssignmentRepository,
    ) {}

    async getStudentAssignment(
        assignmentId: number,
        studentId: number,
    ): Promise<StudentSubjectAssignment> {
        const assignment =
            await this.assignmentRepository.getStudentAssignment(
                assignmentId,
                studentId,
            );

        if (!assignment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return assignment;
    }

    async getTeacherAssignment(
        assignmentId: number,
        teacherId: number,
    ): Promise<TeacherSubjectAssignment> {
        const assignment =
            await this.assignmentRepository.getTeacherAssignment(
                assignmentId,
                teacherId,
            );

        if (!assignment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return assignment;
    }

    async getStudentAttachment(
        assignmentId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string }> {
        const attachment =
            await this.assignmentRepository.getStudentAttachment(
                assignmentId,
                attachmentId,
                studentId,
            );

        if (!attachment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return attachment;
    }

    async getTeacherAttachment(
        assignmentId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string }> {
        const attachment =
            await this.assignmentRepository.getTeacherAttachment(
                assignmentId,
                attachmentId,
                teacherId,
            );

        if (!attachment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return attachment;
    }
}
