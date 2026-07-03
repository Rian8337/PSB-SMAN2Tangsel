import { Class, ValidSession, ValidSemester } from "@psb/shared/types";
import { IClassService, ListClassOptions } from "./IClassService";
import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";
import { IClassRepository, ISessionRepository } from "@/repositories";
import { ConflictError, NotFoundError } from "@/types";

/**
 * A service that is responsible for handling class-related operations.
 */
@Injectable(dependencyTokens.classService)
export class ClassService implements IClassService {
    constructor(
        @inject(dependencyTokens.classRepository)
        private readonly classRepository: IClassRepository,
        @inject(dependencyTokens.sessionRepository)
        private readonly sessionRepository: ISessionRepository,
    ) {}

    async getClassById(id: number): Promise<Class> {
        const clazz = await this.classRepository.getById(id);

        if (!clazz) {
            throw new NotFoundError("classService.classNotFound");
        }

        return clazz;
    }

    async listClasses(options: ListClassOptions = {}): Promise<Class[]> {
        let { session, semester } = options;

        if (!session || !semester) {
            const activeSession = await this.sessionRepository.getActive();

            if (!activeSession) {
                return [];
            }

            session = activeSession.session;
            semester = activeSession.semester;
        }

        return this.classRepository.list(
            session,
            semester,
            options.query,
            options.limit,
            options.offset,
        );
    }

    async createClass(
        name: string,
        session: ValidSession,
        semester: ValidSemester,
    ) {
        const dbSession = await this.sessionRepository.get(session, semester);

        if (!dbSession) {
            throw new NotFoundError("sessionService.sessionNotFound");
        }

        await this.classRepository.create(name, session, semester);
    }

    async updateClass(id: number, name: string) {
        const clazz = await this.classRepository.getById(id);

        if (!clazz) {
            throw new NotFoundError("classService.classNotFound");
        }

        await this.classRepository.update(id, name);
    }

    async deleteClass(id: number) {
        const [hasSubjects, hasStudents] = await Promise.all([
            this.classRepository.hasSubjects(id),
            this.classRepository.hasStudents(id),
        ]);

        if (hasSubjects || hasStudents) {
            throw new ConflictError("classService.classInUse");
        }

        await this.classRepository.delete(id);
    }
}
