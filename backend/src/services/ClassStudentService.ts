import { Injectable } from "@/decorators/injectable";
import { IClassStudentService } from "./IClassStudentService";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";
import { IClassRepository, IClassStudentRepository } from "@/repositories";
import { UserListItem } from "@psb/shared/types";
import { ConflictError, NotFoundError } from "@/types";

/**
 * A service that is responsible for handling operations related to student enrollments in classes.
 */
@Injectable(dependencyTokens.classStudentService)
export class ClassStudentService implements IClassStudentService {
    constructor(
        @inject(dependencyTokens.classRepository)
        private readonly classRepository: IClassRepository,
        @inject(dependencyTokens.classStudentRepository)
        private readonly classStudentRepository: IClassStudentRepository,
    ) {}

    getEnrolledStudents(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]> {
        return this.classStudentRepository.getEnrolledStudents(
            classId,
            query,
            limit,
            offset,
        );
    }

    async getUnenrolledStudents(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]> {
        const clazz = await this.classRepository.getById(classId);

        if (!clazz) {
            throw new NotFoundError("classService.classNotFound");
        }

        return this.classStudentRepository.getUnenrolledStudents(
            clazz.session,
            clazz.semester,
            query,
            limit,
            offset,
        );
    }

    async enrollStudent(classId: number, studentId: number) {
        const clazz = await this.classRepository.getById(classId);

        if (!clazz) {
            throw new NotFoundError("classService.classNotFound");
        }

        const existingEnrollment =
            await this.classStudentRepository.findActiveEnrollment(
                studentId,
                clazz.session,
                clazz.semester,
            );

        if (existingEnrollment) {
            if (existingEnrollment.id === classId) {
                // Student is already enrolled in the class, so we can just return without doing anything.
                return;
            }

            throw new ConflictError("classStudentService.studentIsEnrolled", {
                className: existingEnrollment.name,
            });
        }

        await this.classStudentRepository.enrollStudent(classId, studentId);
    }

    async unenrollStudent(classId: number, studentId: number) {
        await this.classStudentRepository.unenrollStudent(classId, studentId);
    }
}
