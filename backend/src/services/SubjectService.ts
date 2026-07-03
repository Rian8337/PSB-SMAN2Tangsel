import { Injectable } from "@/decorators/injectable";
import { ISubjectService } from "./ISubjectService";
import { dependencyTokens } from "@/dependencies/tokens";
import { Subject } from "@psb/shared/types";
import { ISubjectRepository } from "@/repositories";
import { inject } from "tsyringe";
import { ConflictError, NotFoundError } from "@/types";

/**
 * A service that is responsible for handling subject-related operations.
 */
@Injectable(dependencyTokens.subjectService)
export class SubjectService implements ISubjectService {
    constructor(
        @inject(dependencyTokens.subjectRepository)
        private readonly subjectRepository: ISubjectRepository,
    ) {}

    async findById(id: number): Promise<Subject> {
        const subject = await this.subjectRepository.getById(id);

        if (!subject) {
            throw new NotFoundError("subjectService.subjectNotFound");
        }

        return subject;
    }

    async findByCode(code: string): Promise<Subject> {
        const subject = await this.subjectRepository.getByCode(code);

        if (!subject) {
            throw new NotFoundError("subjectService.subjectNotFound");
        }

        return subject;
    }

    listSubjects(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<Subject[]> {
        return this.subjectRepository.list(query, limit, offset);
    }

    async createSubject(code: string, name: string) {
        const existing = await this.subjectRepository.getByCode(code);

        if (existing) {
            throw new ConflictError("subjectService.duplicateCode");
        }

        return this.subjectRepository.create(code, name);
    }

    async updateSubject(
        id: number,
        code: string,
        name: string,
        active: boolean,
    ) {
        const existing = await this.subjectRepository.getById(id);

        if (!existing) {
            throw new NotFoundError("subjectService.subjectNotFound");
        }

        if (existing.code !== code) {
            const another = await this.subjectRepository.getByCode(code);

            if (another) {
                throw new ConflictError("subjectService.duplicateCode");
            }
        }

        return this.subjectRepository.update(id, code, name, active);
    }

    async deleteSubject(id: number) {
        const subject = await this.subjectRepository.getById(id);

        if (!subject) {
            throw new NotFoundError("subjectService.subjectNotFound");
        }

        const hasClasses = await this.subjectRepository.hasClasses(id);

        if (hasClasses) {
            throw new ConflictError(
                "subjectService.cannotDeleteSubjectWithClasses",
            );
        }

        return this.subjectRepository.delete(id);
    }
}
