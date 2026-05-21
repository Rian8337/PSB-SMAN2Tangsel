import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IMaterialRepository } from "@/repositories";
import { NotFoundError } from "@/types";
import { SubjectMaterial } from "@psb/shared/types";
import { inject } from "tsyringe";
import { IMaterialService } from "./IMaterialService";

/**
 * A service that is responsible for handling operations related to material viewing.
 */
@Injectable(dependencyTokens.materialService)
export class MaterialService implements IMaterialService {
    constructor(
        @inject(dependencyTokens.materialRepository)
        private readonly materialRepository: IMaterialRepository,
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
}
