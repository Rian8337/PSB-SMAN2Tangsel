import { Injectable } from "@/decorators/injectable";
import { ISessionService } from "./ISessionService";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";
import { ISessionRepository } from "@/repositories";
import {
    AcademicSession,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { NotFoundError } from "@/types";

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

    listSessions(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<AcademicSession[]> {
        return this.sessionRepository.listSessions(query, limit, offset);
    }

    deleteSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void> {
        return this.sessionRepository.deleteSession(session, semester);
    }
}
