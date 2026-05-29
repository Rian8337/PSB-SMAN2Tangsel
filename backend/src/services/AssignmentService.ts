import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAssignmentRepository, IClassSubjectRepository } from "@/repositories";
import { NotFoundError } from "@/types";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IAssignmentService } from "./IAssignmentService";
import { IAttachmentService, TempFile } from "./IAttachmentService";
import { INotificationService } from "./INotificationService";

/**
 * A service that is responsible for handling operations related to assignments.
 */
@Injectable(dependencyTokens.assignmentService)
export class AssignmentService implements IAssignmentService {
    constructor(
        @inject(dependencyTokens.assignmentRepository)
        private readonly assignmentRepository: IAssignmentRepository,
        @inject(dependencyTokens.attachmentService)
        private readonly attachmentService: IAttachmentService,
        @inject(dependencyTokens.classSubjectRepository)
        private readonly classSubjectRepository: IClassSubjectRepository,
        @inject(dependencyTokens.notificationService)
        private readonly notificationService: INotificationService,
    ) {}

    async getStudentAssignment(
        assignmentId: number,
        studentId: number,
    ): Promise<StudentSubjectAssignment> {
        const assignment = await this.assignmentRepository.getStudentAssignment(
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
        const assignment = await this.assignmentRepository.getTeacherAssignment(
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
        const attachment = await this.assignmentRepository.getStudentAttachment(
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
        const attachment = await this.assignmentRepository.getTeacherAttachment(
            assignmentId,
            attachmentId,
            teacherId,
        );

        if (!attachment) {
            throw new NotFoundError("assignmentService.notFound");
        }

        return attachment;
    }

    async addAssignment(
        classSubjectId: number,
        teacherId: number,
        title: string,
        description: string | null,
        dueAt: Date | null,
        visible: boolean,
        files: TempFile[],
    ): Promise<TeacherSubjectAssignment> {
        const classSubject =
            await this.classSubjectRepository.getTeacherClassSubject(
                classSubjectId,
                teacherId,
            );

        if (!classSubject) {
            throw new NotFoundError("assignmentService.notFound");
        }

        const savedFiles = await Promise.all(
            files.map((f) => this.attachmentService.saveFile(f)),
        );

        const assignment = await this.assignmentRepository.addAssignment(
            classSubjectId,
            title,
            description,
            dueAt,
            visible,
            savedFiles.map((f) => f.id),
        );

        void this.notificationService.publishToClass(
            classSubject.classId,
            title,
            description ?? "",
            `/subjects/${classSubjectId.toString()}/assignments/${assignment.id.toString()}`,
        );

        return assignment;
    }

    async updateAssignment(
        assignmentId: number,
        teacherId: number,
        title: string,
        description: string | null,
        dueAt: Date | null,
        visible: boolean,
        newFiles: TempFile[],
        renamedAttachments: { id: number; newName: string }[],
        deletedAttachmentIds: number[],
    ): Promise<void> {
        const existing = await this.assignmentRepository.getTeacherAssignment(
            assignmentId,
            teacherId,
        );

        if (!existing) {
            throw new NotFoundError("assignmentService.notFound");
        }

        await this.attachmentService.delete(deletedAttachmentIds);

        await this.attachmentService.updateRenameAttachments(
            renamedAttachments,
        );

        const newSaved = await Promise.all(
            newFiles.map((f) => this.attachmentService.saveFile(f)),
        );

        const deletedSet = new Set(deletedAttachmentIds);

        const keepIds = existing.attachments
            .map((a) => a.id)
            .filter((id) => !deletedSet.has(id))
            .concat(newSaved.map((f) => f.id));

        await this.assignmentRepository.updateAssignment(
            assignmentId,
            title,
            description,
            dueAt,
            visible,
            keepIds,
        );
    }

    async deleteAssignment(
        assignmentId: number,
        teacherId: number,
    ): Promise<void> {
        const existing = await this.assignmentRepository.getTeacherAssignment(
            assignmentId,
            teacherId,
        );

        if (!existing) {
            throw new NotFoundError("assignmentService.notFound");
        }

        const assignmentAttachmentIds =
            await this.assignmentRepository.getAssignmentAttachmentIds(
                assignmentId,
            );

        const submissionAttachmentIds =
            await this.assignmentRepository.getSubmissionAttachmentIds(
                assignmentId,
            );

        await this.attachmentService.delete(
            assignmentAttachmentIds.concat(submissionAttachmentIds),
        );

        await this.assignmentRepository.deleteAssignment(assignmentId);
    }
}
