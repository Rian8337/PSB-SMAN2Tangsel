import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { sessions } from "@psb/shared/schema";
import {
    AcademicSession,
    DrizzleDb,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { ISessionRepository } from "./ISessionRepository";

/**
 * Defines operations for accessing and managing academic session data in the database.
 */
@Injectable(dependencyTokens.sessionRepository)
export class SessionRepository
    extends DatabaseRepository
    implements ISessionRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    getActive(): Promise<AcademicSession | null> {
        return this.db
            .select()
            .from(sessions)
            .where(eq(sessions.active, true))
            .then((res) => res.at(0) ?? null);
    }

    listSessions(
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<AcademicSession[]> {
        let builder = this.db.select().from(sessions);

        if (query) {
            builder = builder.where(
                eq(sessions.session, query as ValidSession),
            ) as typeof builder;
        }

        return builder.limit(limit).offset(offset);
    }

    async deleteSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void> {
        await this.db
            .delete(sessions)
            .where(
                and(
                    eq(sessions.session, session),
                    eq(sessions.semester, semester),
                    eq(sessions.active, null),
                ),
            );
    }
}
