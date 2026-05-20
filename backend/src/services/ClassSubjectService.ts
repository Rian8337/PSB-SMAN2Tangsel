import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    IClassRepository,
    IClassSubjectRepository,
    ISubjectRepository,
} from "@/repositories";
import { ConflictError, NotFoundError } from "@/types";
import {
    ClassSubjectAssignment,
    Subject,
    SubjectDashboard,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IClassSubjectService } from "./IClassSubjectService";

/**
 * A service that is responsible for handling operations related to subject management of classes.
 */
@Injectable(dependencyTokens.classSubjectService)
export class ClassSubjectService implements IClassSubjectService {
    constructor(
        @inject(dependencyTokens.classSubjectRepository)
        private readonly classSubjectRepository: IClassSubjectRepository,
        @inject(dependencyTokens.classRepository)
        private readonly classRepository: IClassRepository,
        @inject(dependencyTokens.subjectRepository)
        private readonly subjectRepository: ISubjectRepository,
    ) {}

    async listAssignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<ClassSubjectAssignment[]> {
        return this.classSubjectRepository.listAssignedSubjects(
            classId,
            query,
            limit,
            offset,
        );
    }

    async listAssignedSubjectsForTeacher(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<ClassSubjectAssignment[]> {
        return this.classSubjectRepository.listAssignedSubjectsForTeacher(
            teacherId,
            session,
            semester,
            query,
            limit,
            offset,
        );
    }

    async listUnassignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<Subject[]> {
        return this.classSubjectRepository.listUnassignedSubjects(
            classId,
            query,
            limit,
            offset,
        );
    }

    async assignSubject(
        classId: number,
        subjectId: number,
        teacherId: number | null,
    ): Promise<void> {
        const clazz = await this.classRepository.getById(classId);

        if (!clazz) {
            throw new NotFoundError("classService.classNotFound");
        }

        const subject = await this.subjectRepository.getById(subjectId);

        if (!subject) {
            throw new NotFoundError("subjectService.subjectNotFound");
        }

        await this.classSubjectRepository.assignSubject(
            classId,
            subjectId,
            teacherId,
        );
    }

    async updateAssignedSubject(
        classId: number,
        assignmentId: number,
        teacherId: number | null,
    ): Promise<void> {
        await this.classSubjectRepository.updateAssignedSubject(
            classId,
            assignmentId,
            teacherId,
        );
    }

    async unassignSubject(
        classId: number,
        assignmentId: number,
    ): Promise<void> {
        const hasContent =
            await this.classSubjectRepository.hasAssociatedContent(
                assignmentId,
            );

        if (hasContent) {
            throw new ConflictError("classSubjectService.classHasContent");
        }

        await this.classSubjectRepository.unassignSubject(
            classId,
            assignmentId,
        );
    }

    async getStudentDashboard(
        classSubjectId: number,
        studentId: number,
    ): Promise<SubjectDashboard> {
        const dashboard =
            await this.classSubjectRepository.getStudentDashboard(
                classSubjectId,
                studentId,
            );

        if (!dashboard) {
            throw new NotFoundError("classSubjectService.notFound");
        }

        return dashboard;
    }

    async getTeacherDashboard(
        classSubjectId: number,
        teacherId: number,
    ): Promise<SubjectDashboard> {
        const dashboard =
            await this.classSubjectRepository.getTeacherDashboard(
                classSubjectId,
                teacherId,
            );

        if (!dashboard) {
            throw new NotFoundError("classSubjectService.notFound");
        }

        return dashboard;
    }
}
