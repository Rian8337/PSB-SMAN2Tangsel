import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { ISessionRepository } from "@/repositories";
import { BadRequestError, ConflictError, NotFoundError } from "@/types";
import {
    AcademicSession,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { ISessionService } from "./ISessionService";

/**
 * A service that is responsible for handling academic session related operations.
 */
@Injectable(dependencyTokens.sessionService)
export class SessionService implements ISessionService {
    constructor(
        @inject(dependencyTokens.sessionRepository)
        private readonly sessionRepository: ISessionRepository,
    ) {}

    async getActive(): Promise<AcademicSession> {
        const active = await this.sessionRepository.getActive();

        if (!active) {
            throw new NotFoundError("sessionService.noActiveSession");
        }

        return active;
    }

    async getSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<AcademicSession> {
        const academicSession = await this.sessionRepository.get(
            session,
            semester,
        );

        if (!academicSession) {
            throw new NotFoundError("sessionService.sessionNotFound");
        }

        return academicSession;
    }

    listSessions(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<AcademicSession[]> {
        return this.sessionRepository.list(query, limit, offset);
    }

    async createSession(
        session: ValidSession,
        semester: ValidSemester,
        startTime: Date,
        endTime: Date,
        active: boolean,
    ) {
        if (startTime >= endTime) {
            throw new BadRequestError("sessionService.invalidSessionTime");
        }

        const existingSession = await this.sessionRepository.get(
            session,
            semester,
        );

        if (existingSession) {
            throw new ConflictError("sessionService.duplicateSession");
        }

        return this.sessionRepository.create(
            session,
            semester,
            startTime,
            endTime,
            active,
        );
    }

    async updateSession(
        session: ValidSession,
        semester: ValidSemester,
        startTime: Date,
        endTime: Date,
        active: boolean,
    ) {
        if (startTime >= endTime) {
            throw new BadRequestError("sessionService.invalidSessionTime");
        }

        const existingSession = await this.sessionRepository.get(
            session,
            semester,
        );

        if (!existingSession) {
            throw new NotFoundError("sessionService.sessionNotFound");
        }

        return this.sessionRepository.update(
            session,
            semester,
            startTime,
            endTime,
            active,
        );
    }

    async deleteSession(session: ValidSession, semester: ValidSemester) {
        const existingSession = await this.sessionRepository.get(
            session,
            semester,
        );

        if (!existingSession) {
            throw new NotFoundError("sessionService.sessionNotFound");
        }

        return this.sessionRepository.delete(session, semester);
    }
}
