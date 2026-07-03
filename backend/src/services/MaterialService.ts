import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IClassSubjectRepository, IMaterialRepository } from "@/repositories";
import { NotFoundError } from "@/types";
import { SubjectMaterial } from "@psb/shared/types";
import { inject } from "tsyringe";
import { IAttachmentService, TempFile } from "./IAttachmentService";
import { IMaterialService } from "./IMaterialService";
import { INotificationService } from "./INotificationService";

/**
 * A service that is responsible for handling operations related to materials.
 */
@Injectable(dependencyTokens.materialService)
export class MaterialService implements IMaterialService {
    constructor(
        @inject(dependencyTokens.materialRepository)
        private readonly materialRepository: IMaterialRepository,
        @inject(dependencyTokens.attachmentService)
        private readonly attachmentService: IAttachmentService,
        @inject(dependencyTokens.classSubjectRepository)
        private readonly classSubjectRepository: IClassSubjectRepository,
        @inject(dependencyTokens.notificationService)
        private readonly notificationService: INotificationService,
    ) {}

    async getStudentMaterial(
        materialId: number,
        studentId: number,
    ): Promise<SubjectMaterial> {
        const material = await this.materialRepository.getStudentMaterial(
            materialId,
            studentId,
        );

        if (!material) {
            throw new NotFoundError("materialService.notFound");
        }

        return material;
    }

    async getTeacherMaterial(
        materialId: number,
        teacherId: number,
    ): Promise<SubjectMaterial> {
        const material = await this.materialRepository.getTeacherMaterial(
            materialId,
            teacherId,
        );

        if (!material) {
            throw new NotFoundError("materialService.notFound");
        }

        return material;
    }

    async getStudentAttachment(
        materialId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string }> {
        const attachment = await this.materialRepository.getStudentAttachment(
            materialId,
            attachmentId,
            studentId,
        );

        if (!attachment) {
            throw new NotFoundError("materialService.notFound");
        }

        return attachment;
    }

    async getTeacherAttachment(
        materialId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string }> {
        const attachment = await this.materialRepository.getTeacherAttachment(
            materialId,
            attachmentId,
            teacherId,
        );

        if (!attachment) {
            throw new NotFoundError("materialService.notFound");
        }

        return attachment;
    }

    async addMaterial(
        classSubjectId: number,
        teacherId: number,
        title: string,
        description: string | null,
        visible: boolean,
        files: TempFile[],
    ): Promise<SubjectMaterial> {
        const classSubject =
            await this.classSubjectRepository.getTeacherClassSubject(
                classSubjectId,
                teacherId,
            );

        if (!classSubject) {
            throw new NotFoundError("materialService.notFound");
        }

        const savedFiles = await Promise.all(
            files.map((f) => this.attachmentService.saveFile(f)),
        );

        const material = await this.materialRepository.addMaterial(
            classSubjectId,
            title,
            description,
            visible,
            savedFiles.map((f) => f.id),
        );

        void this.notificationService.publishToClass(
            classSubject.classId,
            title,
            description ?? "",
            `/subjects/${classSubjectId.toString()}/materials/${material.id.toString()}`,
        );

        return material;
    }

    async updateMaterial(
        materialId: number,
        teacherId: number,
        title: string,
        description: string | null,
        visible: boolean,
        newFiles: TempFile[],
        renamedAttachments: { id: number; newName: string }[],
        deletedAttachmentIds: number[],
    ) {
        const existing = await this.materialRepository.getTeacherMaterial(
            materialId,
            teacherId,
        );

        if (!existing) {
            throw new NotFoundError("materialService.notFound");
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

        await this.materialRepository.updateMaterial(
            materialId,
            title,
            description,
            visible,
            keepIds,
        );
    }

    async deleteMaterial(materialId: number, teacherId: number) {
        const existing = await this.materialRepository.getTeacherMaterial(
            materialId,
            teacherId,
        );

        if (!existing) {
            throw new NotFoundError("materialService.notFound");
        }

        const attachmentIds =
            await this.materialRepository.getMaterialAttachmentIds(materialId);

        await this.attachmentService.delete(attachmentIds);
        await this.materialRepository.deleteMaterial(materialId);
    }
}
